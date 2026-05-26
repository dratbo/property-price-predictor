import os
from contextlib import contextmanager

import psycopg2
import psycopg2.extras


def get_database_url() -> str:
    return os.getenv(
        "DATABASE_URL",
        "postgres://property:property@localhost:5432/property_db",
    )


@contextmanager
def get_connection():
    conn = psycopg2.connect(get_database_url())
    try:
        yield conn
    finally:
        conn.close()


def fetch_properties():
    query = """
        SELECT area, rooms, city, district, metro, floor, total_floors,
               building_type, year_built, developer, repair_type, price
        FROM properties
        WHERE price > 0 AND area > 0 AND rooms > 0
    """
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query)
            return cur.fetchall()
