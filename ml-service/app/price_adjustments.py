"""Корректировка базовой цены ML по бизнес-правилам (для наглядного прогноза)."""

from __future__ import annotations

# 9 зон — для всех городов; центр дороже
DISTRICT_MULTIPLIERS: dict[str, float] = {
    "центр": 1.10,
    "север": 1.02,
    "северо-восток": 1.00,
    "восток": 0.98,
    "юго-восток": 0.96,
    "юг": 0.97,
    "юго-запад": 0.99,
    "запад": 1.03,
    "северо-запад": 1.01,
}

# Ремонт квартиры: от дорогого к дешёвому
REPAIR_TYPE_MULTIPLIERS: dict[str, float] = {
    "дизайнерский": 1.08,
    "евроремонт": 1.06,
    "косметический": 1.02,
    "чистовая": 1.00,
    "предчистовая": 0.96,
    "черновая": 0.88,
    "требует ремонта": 0.90,
}

APARTMENT_TYPE_MULTIPLIERS: dict[str, float] = {
    "первичка": 1.05,
    "вторичка": 1.00,
}

HOUSING_TYPE_MULTIPLIERS: dict[str, float] = {
    "квартира": 1.00,
    "студия": 1.04,
    "апартаменты": 0.97,
}

# Ремонт дома
BUILDING_REPAIR_MULTIPLIERS: dict[str, float] = {
    "капитальный": 1.04,
    "косметический": 1.03,
    "свежий": 0.99,
    "без ремонта": 0.92,
}

# Надёжные / элитные застройщики
DEVELOPER_MULTIPLIERS: dict[str, float] = {
    "пик": 1.03,
    "самолёт": 1.04,
    "самолет": 1.04,
    "лср": 1.03,
    "донстрой": 1.05,
    "capital group": 1.06,
    "эталон": 1.04,
    "брусника": 1.05,
    "ак барс": 1.02,
    "сз столица": 1.01,
    "сз столица н": 1.01,
}

PREMIUM_DEVELOPERS = {"донстрой", "capital group", "самолёт", "самолет", "эталон", "брусника"}


def _norm(value: str | None) -> str:
    return (value or "").strip().lower()


def _lookup(table: dict[str, float], value: str | None) -> float:
    key = _norm(value)
    if not key or key == "любой":
        return 1.0
    return table.get(key, 1.0)


def year_built_multiplier(year_built: int | None, developer: str | None) -> float:
    if year_built is None:
        return 1.0
    # Базовая линия ~2005; новее — дороже
    factor = 1.0 + (year_built - 2005) * 0.004
    factor = max(0.90, min(1.10, factor))
    dev_key = _norm(developer)
    if year_built >= 2015 and dev_key in PREMIUM_DEVELOPERS:
        factor *= 1.02
    if year_built < 1970:
        factor *= 0.96
    return max(0.88, min(1.12, factor))


def apply_price_adjustments(base_price: float, features: dict) -> float:
    """Возвращает скорректированную цену."""
    m = 1.0
    m *= _lookup(DISTRICT_MULTIPLIERS, features.get("district"))
    m *= _lookup(APARTMENT_TYPE_MULTIPLIERS, features.get("apartment_type"))
    m *= _lookup(HOUSING_TYPE_MULTIPLIERS, features.get("housing_type"))
    m *= _lookup(REPAIR_TYPE_MULTIPLIERS, features.get("repair_type"))
    m *= _lookup(BUILDING_REPAIR_MULTIPLIERS, features.get("building_repair_type"))
    m *= _lookup(DEVELOPER_MULTIPLIERS, features.get("developer"))
    m *= year_built_multiplier(features.get("year_built"), features.get("developer"))
    return max(0.0, base_price * m)
