-- Исправляем проблему с ID в таблице users

-- Добавляем расширение для UUID если еще нет
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Изменяем колонку id чтобы она автоматически генерировала UUID
ALTER TABLE users
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Проверка
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id';