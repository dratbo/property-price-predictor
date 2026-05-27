import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from . import analytics, model_trainer, price_adjustments
from .database import fetch_properties

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RETRAIN_EVERY_N = int(os.getenv("RETRAIN_EVERY_N", "100"))
_last_trained_count = 0


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        metrics = model_trainer.train_and_save()
        logger.info("Model trained on startup: %s", metrics)
    except Exception as exc:
        logger.warning("Startup training skipped: %s", exc)
    yield


app = FastAPI(title="Property Price ML Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


MIN_FLOOR = 1
MAX_FLOOR = 100
MIN_TOTAL_FLOORS = 1
MAX_TOTAL_FLOORS = 75


class PredictRequest(BaseModel):
    area: float = Field(gt=0)
    rooms: int = Field(gt=0)
    city: str
    district: Optional[str] = None
    metro: Optional[str] = None
    floor: Optional[int] = Field(None, ge=MIN_FLOOR, le=MAX_FLOOR)
    total_floors: Optional[int] = Field(None, ge=MIN_TOTAL_FLOORS, le=MAX_TOTAL_FLOORS)
    building_type: Optional[str] = None
    year_built: Optional[int] = Field(None, ge=1901, le=2026)
    developer: Optional[str] = None
    repair_type: Optional[str] = None
    building_repair_type: Optional[str] = None

    @model_validator(mode="after")
    def check_floor_vs_total(self):
        if self.floor is not None and self.total_floors is not None and self.floor > self.total_floors:
            raise ValueError("floor cannot be greater than total_floors")
        return self


class CityStat(BaseModel):
    city: str
    count: int
    avg_price: float
    avg_price_per_sqm: float
    annual_growth_rate_percent: float


@app.get("/health")
def health():
    model_exists = model_trainer.MODEL_PATH.exists()
    rows = fetch_properties()
    return {
        "status": "ok",
        "model_loaded": model_exists,
        "properties_in_db": len(rows),
    }


@app.get("/analytics/cities")
def cities_analytics():
    rows = fetch_properties()
    stats = analytics.city_stats_from_rows(rows)
    result = []
    for city, data in sorted(stats.items(), key=lambda x: x[1]["avg_price"], reverse=True):
        rate = analytics.annual_growth_rate(city)
        result.append(
            CityStat(
                city=city,
                count=int(data["count"]),
                avg_price=round(data["avg_price"], 0),
                avg_price_per_sqm=round(data["avg_price_per_sqm"], 0),
                annual_growth_rate_percent=round(rate * 100, 1),
            )
        )
    return result


def _build_predict_response(req: PredictRequest) -> dict[str, Any]:
    features = req.model_dump()
    base_predicted = model_trainer.predict_price(features)
    predicted = price_adjustments.apply_price_adjustments(base_predicted, features)
    area = req.area
    price_per_sqm = predicted / area if area > 0 else 0

    rows = fetch_properties()
    city_stats = analytics.city_stats_from_rows(rows)
    profile_stats = analytics.city_stats_for_profile(rows, req.area, req.rooms)
    city_data = city_stats.get(analytics.normalize_city(req.city), {})
    city_avg = city_data.get("avg_price")
    city_avg_sqm = city_data.get("avg_price_per_sqm")

    rate = analytics.annual_growth_rate(req.city)
    trend_info = analytics.assess_trend(predicted, city_avg, rate)
    forecast = analytics.build_forecast_12m(predicted, req.city)

    return {
        "predicted_price": round(predicted, 0),
        "price_per_sqm": round(price_per_sqm, 0),
        "city": req.city,
        "city_avg_price": round(city_avg, 0) if city_avg else None,
        "city_avg_price_per_sqm": round(city_avg_sqm, 0) if city_avg_sqm else None,
        "city_listings_count": int(city_data.get("count", 0)),
        "profile_stats": [
            {
                "city": city,
                "count": int(data["count"]),
                "avg_price": round(data["avg_price"], 0),
                "avg_price_per_sqm": round(data["avg_price_per_sqm"], 0),
                "annual_growth_rate_percent": round(
                    analytics.annual_growth_rate(city) * 100, 1
                ),
            }
            for city, data in sorted(
                profile_stats.items(), key=lambda x: x[1]["avg_price"], reverse=True
            )
        ],
        "profile_filter": {
            "area": req.area,
            "rooms": req.rooms,
        },
        "forecast_12m": forecast,
        **trend_info,
    }


@app.post("/predict")
def predict(req: PredictRequest):
    global _last_trained_count
    try:
        result = _build_predict_response(req)
        rows = fetch_properties()
        count = len(rows)
        if count - _last_trained_count >= RETRAIN_EVERY_N:
            try:
                model_trainer.train_and_save()
                _last_trained_count = count
            except Exception as exc:
                logger.warning("Auto-retrain failed: %s", exc)
        return result
    except Exception as exc:
        logger.exception("Predict failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/retrain")
def retrain():
    global _last_trained_count
    try:
        metrics = model_trainer.train_and_save()
        _last_trained_count = metrics.get("total_samples", 0)
        return {"status": "ok", "metrics": metrics}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
