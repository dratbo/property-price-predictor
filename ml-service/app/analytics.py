"""Региональная аналитика и прогноз динамики цен по городам."""

from datetime import datetime
from typing import Any

import pandas as pd

from .regions_config import CITY_ANNUAL_GROWTH, DEFAULT_GROWTH


def normalize_city(city: str) -> str:
    return (city or "").strip()


def annual_growth_rate(city: str) -> float:
    return CITY_ANNUAL_GROWTH.get(normalize_city(city), DEFAULT_GROWTH)


def city_stats_from_rows(rows: list[dict]) -> dict[str, dict[str, float]]:
    if not rows:
        return {}
    df = pd.DataFrame(rows)
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df["area"] = pd.to_numeric(df["area"], errors="coerce")
    df = df.dropna(subset=["price", "area", "city"])
    df = df[df["area"] > 0]
    df["price_per_sqm"] = df["price"] / df["area"]

    stats: dict[str, dict[str, float]] = {}
    for city, group in df.groupby("city"):
        stats[str(city)] = {
            "count": int(len(group)),
            "avg_price": float(group["price"].mean()),
            "avg_price_per_sqm": float(group["price_per_sqm"].mean()),
            "median_price": float(group["price"].median()),
            "min_price": float(group["price"].min()),
            "max_price": float(group["price"].max()),
        }
    return stats


def build_forecast_12m(current_price: float, city: str) -> list[dict[str, Any]]:
    rate = annual_growth_rate(city)
    monthly = (1 + rate) ** (1 / 12) - 1
    forecast = []
    price = current_price
    now = datetime.utcnow()
    for i in range(1, 13):
        price *= 1 + monthly
        month_dt = datetime(now.year, now.month, 1)
        month = month_dt.month + i
        year = month_dt.year + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        forecast.append(
            {
                "month": f"{year}-{month:02d}",
                "price": round(price, 0),
                "label": f"{month:02d}.{year}",
            }
        )
    return forecast


def assess_trend(
    predicted_price: float,
    city_avg: float | None,
    annual_rate: float,
) -> dict[str, Any]:
    vs_market = None
    if city_avg and city_avg > 0:
        vs_market = round((predicted_price / city_avg - 1) * 100, 1)

    if annual_rate >= 0.055:
        trend = "growth"
        label = "Ожидается умеренный рост цен в регионе"
        outlook = "positive"
    elif annual_rate >= 0.035:
        trend = "stable"
        label = "Рынок стабилен, умеренный рост"
        outlook = "neutral"
    else:
        trend = "decline"
        label = "Рост замедлен, осторожный прогноз"
        outlook = "caution"

    if vs_market is not None:
        if vs_market > 8:
            label = "Объект дороже среднего по городу — потенциал роста ниже среднего"
            outlook = "caution"
        elif vs_market < -8:
            label = "Объект дешевле рынка — возможен рост цены"
            outlook = "positive"

    return {
        "trend": trend,
        "trend_label": label,
        "outlook": outlook,
        "vs_market_percent": vs_market,
        "annual_growth_rate_percent": round(annual_rate * 100, 1),
    }
