-- Перевод всех объектов на 9 зон (для единого справочника в UI и ML)
UPDATE properties SET district = 'Центр' WHERE id % 9 = 0;
UPDATE properties SET district = 'Север' WHERE id % 9 = 1;
UPDATE properties SET district = 'Северо-Восток' WHERE id % 9 = 2;
UPDATE properties SET district = 'Восток' WHERE id % 9 = 3;
UPDATE properties SET district = 'Юго-Восток' WHERE id % 9 = 4;
UPDATE properties SET district = 'Юг' WHERE id % 9 = 5;
UPDATE properties SET district = 'Юго-Запад' WHERE id % 9 = 6;
UPDATE properties SET district = 'Запад' WHERE id % 9 = 7;
UPDATE properties SET district = 'Северо-Запад' WHERE id % 9 = 8;
