-- Для уже развёрнутой БД: новый признак «Ремонт дома»
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_repair_type TEXT;
