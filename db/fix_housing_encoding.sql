-- Исправление кодировки после миграции через PowerShell
UPDATE properties SET housing_type = 'квартира';

UPDATE properties
SET apartment_type = CASE
    WHEN year_built IS NOT NULL AND year_built >= 2018 THEN 'первичка'
    ELSE 'вторичка'
END;
