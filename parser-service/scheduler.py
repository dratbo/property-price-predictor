"""Планировщик: запуск парсера по расписанию (по умолчанию раз в 24 часа)."""

import logging
import os
import time

from parser import run

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INTERVAL_HOURS = float(os.getenv("PARSER_INTERVAL_HOURS", "24"))
INTERVAL_SEC = max(3600, int(INTERVAL_HOURS * 3600))


def main():
    logger.info("Scheduler started. Interval: %s hours", INTERVAL_HOURS)
    while True:
        try:
            run()
        except Exception as exc:
            logger.exception("Parser run failed: %s", exc)
        logger.info("Next run in %s hours", INTERVAL_HOURS)
        time.sleep(INTERVAL_SEC)


if __name__ == "__main__":
    main()
