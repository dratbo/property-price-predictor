-- Тип жилья, тип квартиры (первичка/вторичка)
ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS housing_type TEXT DEFAULT 'квартира',
    ADD COLUMN IF NOT EXISTS apartment_type TEXT;

UPDATE properties SET housing_type = 'квартира' WHERE housing_type IS NULL OR TRIM(housing_type) = '';

UPDATE properties
SET apartment_type = CASE
    WHEN year_built IS NOT NULL AND year_built >= 2018 THEN 'первичка'
    ELSE 'вторичка'
END
WHERE apartment_type IS NULL OR TRIM(apartment_type) = '';
