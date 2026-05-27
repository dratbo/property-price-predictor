-- Корректировка цен по Москве под рынок ~14–15 млн за ~50 м² (≈285–320 тыс. ₽/м²)
-- Запуск: psql или docker exec ... -f db/fix_moscow_prices.sql
-- После применения: POST http://localhost:8000/retrain

UPDATE properties
SET price = ROUND(
    area * CASE
        WHEN district IN (
            'Хамовники', 'Тверской', 'Арбат', 'Пресненский',
            'Аэропорт', 'Дорогомилово', 'Басманный'
        ) THEN 310000
        WHEN district IN ('Мещанский', 'Коньково', 'Академический') THEN 295000
        ELSE 285000
    END,
    -3
),
updated_at = NOW()
WHERE city = 'Москва';
