"""
Парсер объявлений о недвижимости.
При наличии cianparser — сбор с ЦИАН по городам; иначе демо-записи.
"""

import logging
import os
import random
from datetime import datetime

import psycopg2

from regions import get_parser_cities

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgres://property:property@localhost:5432/property_db",
)

# Демо-объекты с уникальными source_url (если cianparser не установлен)
def _apartment_type(year_built: int | None) -> str:
    if year_built is not None and year_built >= 2018:
        return "первичка"
    return "вторичка"


def _with_defaults(listing: dict) -> dict:
    year = listing.get("year_built")
    listing.setdefault("housing_type", "квартира")
    listing.setdefault("apartment_type", _apartment_type(year))
    return listing


DEMO_LISTINGS = [
    {"address": "ул. Садовая, 12", "city": "Москва", "district": "Таганский", "metro": "Таганская",
     "area": 47.0, "rooms": 2, "floor": 4, "total_floors": 10, "building_type": "кирпичный",
     "year_built": 2008, "developer": "ПИК", "housing_type": "квартира", "apartment_type": "вторичка",
     "repair_type": "евроремонт", "building_repair_type": "капитальный", "price": 11500000,
     "source_url": "https://demo.cian.ru/msk-parser-1"},
    {"address": "ул. Гагарина, 3", "city": "Казань", "district": "Советский", "metro": None,
     "area": 36.5, "rooms": 1, "floor": 7, "total_floors": 16, "building_type": "монолитный",
     "year_built": 2019, "developer": "СЗ Столица", "housing_type": "квартира", "apartment_type": "первичка",
     "repair_type": "чистовая", "building_repair_type": "свежий", "price": 5100000,
     "source_url": "https://demo.cian.ru/kzn-parser-1"},
    {"address": "ул. Красный пр., 180", "city": "Новосибирск", "district": "Центральный", "metro": "Красный проспект",
     "area": 56.0, "rooms": 2, "floor": 8, "total_floors": 14, "building_type": "монолитный",
     "year_built": 2010, "developer": None, "repair_type": "евроремонт", "building_repair_type": "косметический", "price": 5500000,
     "source_url": "https://demo.cian.ru/nsk-parser-1"},
    {"address": "ул. Малышева, 12", "city": "Екатеринбург", "district": "Ленинский", "metro": "Геологическая",
     "area": 54.0, "rooms": 2, "floor": 8, "total_floors": 16, "building_type": "монолитный",
     "year_built": 2015, "developer": None, "repair_type": "евроремонт", "building_repair_type": "капитальный", "price": 7200000,
     "source_url": "https://demo.cian.ru/ekb-parser-1"},
    {"address": "ул. Красная, 120", "city": "Краснодар", "district": "Центральный", "metro": None,
     "area": 48.0, "rooms": 2, "floor": 5, "total_floors": 10, "building_type": "кирпичный",
     "year_built": 2012, "developer": None, "repair_type": "евроремонт", "building_repair_type": "без ремонта", "price": 6800000,
     "source_url": "https://demo.cian.ru/krd-parser-1"},
    {"address": "пр. Мира, 88", "city": "Санкт-Петербург", "district": "Выборгский", "metro": "Площадь Мужества",
     "area": 28.0, "rooms": 1, "floor": 12, "total_floors": 25, "building_type": "монолитный",
     "year_built": 2020, "developer": "ЛСР", "housing_type": "студия", "apartment_type": "первичка",
     "repair_type": "чистовая", "building_repair_type": "свежий", "price": 6200000,
     "source_url": "https://demo.cian.ru/spb-studio-1"},
    {"address": "ул. Ленина, 45", "city": "Сочи", "district": "Центральный", "metro": None,
     "area": 42.0, "rooms": 1, "floor": 3, "total_floors": 8, "building_type": "монолитный",
     "year_built": 2017, "developer": None, "housing_type": "апартаменты", "apartment_type": "вторичка",
     "repair_type": "евроремонт", "building_repair_type": "косметический", "price": 8900000,
     "source_url": "https://demo.cian.ru/sochi-apartments-1"},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def upsert_property(conn, listing: dict) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO properties (
                address, city, district, metro, area, rooms, floor, total_floors,
                building_type, year_built, developer, housing_type, apartment_type,
                repair_type, building_repair_type, price, source_url
            ) VALUES (
                %(address)s, %(city)s, %(district)s, %(metro)s, %(area)s, %(rooms)s,
                %(floor)s, %(total_floors)s, %(building_type)s, %(year_built)s,
                %(developer)s, %(housing_type)s, %(apartment_type)s,
                %(repair_type)s, %(building_repair_type)s, %(price)s, %(source_url)s
            )
            ON CONFLICT (source_url) WHERE source_url IS NOT NULL DO NOTHING
            RETURNING id
            """,
            listing,
        )
        inserted = cur.fetchone()
    conn.commit()
    return inserted is not None


def parse_with_cianparser(city: str, limit: int = 15) -> list[dict]:
    try:
        from cianparser import cianparser
    except ImportError:
        logger.info("cianparser not installed for %s", city)
        return []

    parser = cianparser.CianParser(location=city)
    data = parser.get_flats(
        deal_type="sale",
        rooms=random.choice([1, 2, 3]),
        additional_settings={"start_page": 1, "end_page": 1},
    )
    listings = []
    for item in (data or [])[:limit]:
        url = item.get("url") or item.get("link")
        if not url:
            continue
        year_built = item.get("build_year")
        listings.append(
            _with_defaults(
                {
                    "address": item.get("address") or item.get("street", "не указан"),
                    "city": city,
                    "district": item.get("district"),
                    "metro": item.get("underground"),
                    "area": float(item.get("total_meters") or item.get("area") or 0),
                    "rooms": int(item.get("rooms_count") or item.get("rooms") or 1),
                    "floor": item.get("floor"),
                    "total_floors": item.get("floors_count"),
                    "building_type": item.get("house_material"),
                    "year_built": year_built,
                    "developer": item.get("developer"),
                    "repair_type": item.get("repair"),
                    "building_repair_type": item.get("building_repair") or item.get("house_repair"),
                    "price": float(item.get("price") or 0),
                    "source_url": url,
                }
            )
        )
    return [l for l in listings if l["area"] > 0 and l["price"] > 0]


def run(cities: list[str] | None = None):
    cities = cities or get_parser_cities()
    logger.info("Parser started at %s for %d cities", datetime.utcnow().isoformat(), len(cities))
    conn = get_connection()
    added = 0

    for city in cities:
        logger.info("Parsing city: %s", city)
        for listing in parse_with_cianparser(city):
            listing = _with_defaults(listing)
            if upsert_property(conn, listing):
                added += 1
                logger.info("Added from CIAN: %s — %s", city, listing["address"])

    for listing in DEMO_LISTINGS:
        listing = _with_defaults(dict(listing))
        if upsert_property(conn, listing):
            added += 1
            logger.info("Added demo: %s", listing["city"])

    conn.close()
    logger.info("Parser finished. New records: %d", added)
    return added


if __name__ == "__main__":
    run()
