"""
Дополняет таблицу properties до TARGET объектов в каждом из 26 городов.
По умолчанию TARGET=100 (переменная окружения SEED_TARGET_PER_CITY).

Запуск в Docker:
  docker run --rm --network property-price-predictor_default ^
    -v "d:/MIREA/TSPO-project/property-price-predictor/db:/db" ^
    -e DATABASE_URL=postgres://property:property@postgres:5432/property_db ^
    python:3.12-slim sh -c "pip install -q psycopg2-binary && python /db/seed_to_30_per_city.py"
"""

import os
import random
import uuid

import psycopg2

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgres://property:property@localhost:5433/property_db",
)

CITIES = [
    "Москва",
    "Санкт-Петербург",
    "Казань",
    "Новосибирск",
    "Екатеринбург",
    "Краснодар",
    "Сочи",
    "Нижний Новгород",
    "Самара",
    "Ростов-на-Дону",
    "Воронеж",
    "Уфа",
    "Красноярск",
    "Пермь",
    "Волгоград",
    "Омск",
    "Челябинск",
    "Тюмень",
    "Иркутск",
    "Хабаровск",
    "Владивосток",
    "Барнаул",
    "Ярославль",
    "Тула",
    "Калининград",
    "Саратов",
]

# Базовая цена за м² по городу (руб), далее ±20% случайно
PRICE_PER_SQM = {
    "Москва": 300_000,  # ~15 млн за 50 м²
    "Санкт-Петербург": 190_000,
    "Сочи": 220_000,
    "Краснодар": 145_000,
    "Тюмень": 155_000,
    "Владивосток": 150_000,
    "Екатеринбург": 120_000,
    "Казань": 105_000,
    "Нижний Новгород": 95_000,
    "Новосибирск": 90_000,
    "Ростов-на-Дону": 88_000,
    "Самара": 85_000,
    "Уфа": 82_000,
    "Красноярск": 80_000,
    "Пермь": 78_000,
    "Воронеж": 75_000,
    "Волгоград": 72_000,
    "Омск": 70_000,
    "Челябинск": 68_000,
    "Иркутск": 75_000,
    "Хабаровск": 95_000,
    "Барнаул": 65_000,
    "Ярославль": 70_000,
    "Тула": 72_000,
    "Калининград": 85_000,
    "Саратов": 68_000,
}

CITY_ROOM_BASE_SQM = {
    "Москва": {1: 345_000, 2: 305_000, 3: 295_000, 4: 285_000},
    "Санкт-Петербург": {1: 235_000, 2: 205_000, 3: 190_000, 4: 180_000},
    "Казань": {1: 125_000, 2: 112_000, 3: 102_000, 4: 95_000},
    "Сочи": {1: 255_000, 2: 235_000, 3: 220_000, 4: 205_000},
    "Екатеринбург": {1: 145_000, 2: 125_000, 3: 115_000, 4: 108_000},
    "Краснодар": {1: 170_000, 2: 150_000, 3: 138_000, 4: 128_000},
}

ROOM_AREA_RANGE = {
    1: (28, 42),
    2: (43, 62),
    3: (63, 85),
    4: (86, 120),
}

STREETS = [
    "ул. Ленина", "ул. Мира", "ул. Советская", "ул. Гагарина", "пр. Победы",
    "ул. Пушкина", "ул. Садовая", "ул. Новая", "ул. Центральная", "ул. Зелёная",
    "пр. Мира", "ул. Комсомольская", "ул. Школьная", "ул. Лесная", "ул. Полевая",
]

DISTRICT_ZONES = [
    "Центр",
    "Север",
    "Северо-Восток",
    "Восток",
    "Юго-Восток",
    "Юг",
    "Юго-Запад",
    "Запад",
    "Северо-Запад",
]

ZONE_PRICE_FACTOR = {
    "Центр": 1.10,
    "Север": 1.02,
    "Северо-Восток": 1.00,
    "Восток": 0.98,
    "Юго-Восток": 0.96,
    "Юг": 0.97,
    "Юго-Запад": 0.99,
    "Запад": 1.03,
    "Северо-Запад": 1.01,
}

REPAIR_PRICE_FACTOR = {
    "дизайнерский": 1.08,
    "евроремонт": 1.06,
    "косметический": 1.02,
    "чистовая": 1.00,
    "требует ремонта": 0.90,
}

BUILDING_REPAIR_PRICE_FACTOR = {
    "капитальный": 1.04,
    "косметический": 1.03,
    "свежий": 0.99,
    "без ремонта": 0.92,
}

DEVELOPER_PRICE_FACTOR = {
    "ПИК": 1.03,
    "Самолёт": 1.04,
    "ЛСР": 1.03,
    "Донстрой": 1.05,
    "Ак Барс": 1.02,
    "Эталон": 1.04,
    "Брусника": 1.05,
}

BUILDING_TYPES = ["кирпичный", "панельный", "монолитный", "кирпично-монолитный"]
REPAIR_TYPES = ["евроремонт", "косметический", "чистовая", "требует ремонта", "дизайнерский"]
BUILDING_REPAIR_TYPES = ["капитальный", "косметический", "без ремонта", "свежий", None, None]
DEVELOPERS = ["ПИК", "Самолёт", "ЛСР", "Ак Барс", "Донстрой", None, None, None]
METROS = {
    "Москва": ["Тверская", "Арбатская", "Киевская", "Профсоюзная", "Беляево"],
    "Санкт-Петербург": ["Невский проспект", "Площадь Восстания", "Беговая", "Чёрная речка"],
    "Казань": ["Кремлёвская", "Площадь Тукая", "Аметьево"],
    "Новосибирск": ["Красный проспект", "Площадь Ленина", "Октябрьская"],
}

TARGET = int(os.getenv("SEED_TARGET_PER_CITY", "100"))


def random_property(city: str, index: int) -> dict:
    rooms = random.randint(1, 4)
    area_min, area_max = ROOM_AREA_RANGE.get(rooms, (28, 95))
    area = round(random.uniform(area_min, area_max), 1)
    total_floors = random.randint(max(5, rooms + 2), 25)
    floor = random.randint(1, total_floors)
    city_room_prices = CITY_ROOM_BASE_SQM.get(city, {})
    base_sqm = city_room_prices.get(rooms, PRICE_PER_SQM.get(city, 75_000))
    sqm = base_sqm * random.uniform(0.82, 1.18)
    district = random.choice(DISTRICT_ZONES)
    repair_type = random.choice(REPAIR_TYPES)
    building_repair = random.choice([b for b in BUILDING_REPAIR_TYPES if b])
    developer = random.choice([d for d in DEVELOPERS if d])
    year_built = random.randint(1965, 2023)

    price = area * sqm
    price *= ZONE_PRICE_FACTOR.get(district, 1.0)
    price *= REPAIR_PRICE_FACTOR.get(repair_type, 1.0)
    price *= BUILDING_REPAIR_PRICE_FACTOR.get(building_repair, 1.0)
    if developer:
        price *= DEVELOPER_PRICE_FACTOR.get(developer, 1.0)
    price *= 1.0 + (year_built - 2005) * 0.004
    price = round(price, -3)

    metro_list = METROS.get(city)

    return {
        "address": f"{random.choice(STREETS)}, {random.randint(1, 120)}",
        "city": city,
        "district": district,
        "metro": random.choice(metro_list) if metro_list and random.random() > 0.35 else None,
        "area": area,
        "rooms": rooms,
        "floor": floor,
        "total_floors": total_floors,
        "building_type": random.choice(BUILDING_TYPES),
        "year_built": year_built,
        "developer": developer,
        "repair_type": repair_type,
        "building_repair_type": building_repair,
        "price": price,
        "source_url": f"https://demo.bulk/{city}/{index}-{uuid.uuid4().hex[:8]}",
    }


def main():
    random.seed(42)
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("SELECT city, COUNT(*) FROM properties GROUP BY city")
    counts = {row[0]: row[1] for row in cur.fetchall()}

    insert_sql = """
        INSERT INTO properties (
            address, city, district, metro, area, rooms, floor, total_floors,
            building_type, year_built, developer, repair_type, building_repair_type, price, source_url
        ) VALUES (
            %(address)s, %(city)s, %(district)s, %(metro)s, %(area)s, %(rooms)s,
            %(floor)s, %(total_floors)s, %(building_type)s, %(year_built)s,
            %(developer)s, %(repair_type)s, %(building_repair_type)s, %(price)s, %(source_url)s
        )
        ON CONFLICT (source_url) WHERE source_url IS NOT NULL DO NOTHING
    """

    total_added = 0
    for city in CITIES:
        current = counts.get(city, 0)
        need = max(0, TARGET - current)
        added_city = 0
        for i in range(need):
            row = random_property(city, i)
            cur.execute(insert_sql, row)
            if cur.rowcount:
                added_city += 1
        total_added += added_city
        print(f"{city}: было {current}, добавлено {added_city}, цель {TARGET}")

    conn.commit()
    cur.execute("SELECT COUNT(DISTINCT city), COUNT(*) FROM properties")
    cities, total = cur.fetchone()
    print(f"\nИтого: {cities} городов, {total} объектов")
    conn.close()


if __name__ == "__main__":
    main()
