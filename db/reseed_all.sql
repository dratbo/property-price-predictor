-- Полное обновление каталога под новую схему
TRUNCATE TABLE favorites, properties RESTART IDENTITY CASCADE;
