import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import analytics, model_trainer
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


class PredictRequest(BaseModel):
    area: float = Field(gt=0)
    rooms: int = Field(gt=0)
    city: str
    district: Optional[str] = None
    metro: Optional[str] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    building_type: Optional[str] = None
    year_built: Optional[int] = None
    developer: Optional[str] = None
    repair_type: Optional[str] = None


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
    predicted = model_trainer.predict_price(features)
    area = req.area
    price_per_sqm = predicted / area if area > 0 else 0

    rows = fetch_properties()
    city_stats = analytics.city_stats_from_rows(rows)
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
