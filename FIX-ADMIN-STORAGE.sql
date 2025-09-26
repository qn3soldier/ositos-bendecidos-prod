-- ====================================
-- ИСПРАВЛЕНИЕ STORAGE И ADMIN PERMISSIONS
-- Выполните этот скрипт в Supabase SQL Editor
-- ====================================

-- 1. СОЗДАЕМ BUCKET ДЛЯ ПРОДУКТОВ (если еще не создан)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. УДАЛЯЕМ ВСЕ СТАРЫЕ ПОЛИТИКИ
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete" ON storage.objects;

-- 3. СОЗДАЕМ НОВЫЕ ОТКРЫТЫЕ ПОЛИТИКИ ДЛЯ PRODUCTS
-- Публичное чтение
CREATE POLICY "Public can read products" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

-- Любой может загружать (временно для отладки)
CREATE POLICY "Anyone can upload products" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products');

-- Любой может обновлять (временно для отладки)
CREATE POLICY "Anyone can update products" ON storage.objects
FOR UPDATE USING (bucket_id = 'products');

-- Любой может удалять (временно для отладки)
CREATE POLICY "Anyone can delete products" ON storage.objects
FOR DELETE USING (bucket_id = 'products');

-- 4. ПРОВЕРЯЕМ АДМИН ПОЛЬЗОВАТЕЛЯ
-- Убедимся что админ существует и имеет правильную роль
UPDATE users
SET role = 'admin',
    password = COALESCE(password, '$2a$10$PJxDe7Px7XFTN4UecwPyNOtE6QFDMgFWUsr1FHRpLxQeIKN0DpAH.'),
    first_name = COALESCE(first_name, 'Admin'),
    last_name = COALESCE(last_name, 'User')
WHERE email = 'admin@ositos.com';

-- Если админа нет, создаем его со всеми обязательными полями
INSERT INTO users (email, password, first_name, last_name, role, created_at)
VALUES (
  'admin@ositos.com',
  '$2a$10$PJxDe7Px7XFTN4UecwPyNOtE6QFDMgFWUsr1FHRpLxQeIKN0DpAH.', -- bcrypt hash для OsitosAdmin2025!
  'Admin',
  'User',
  'admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin',
    password = COALESCE(users.password, '$2a$10$PJxDe7Px7XFTN4UecwPyNOtE6QFDMgFWUsr1FHRpLxQeIKN0DpAH.'),
    first_name = COALESCE(users.first_name, 'Admin'),
    last_name = COALESCE(users.last_name, 'User');

-- 5. ВЫВОДИМ ИНФОРМАЦИЮ О BUCKET
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'products';

-- 7. ПРОВЕРЯЕМ ПОЛИТИКИ
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;

-- ====================================
-- ПОСЛЕ ВЫПОЛНЕНИЯ:
-- 1. Storage bucket 'products' будет публичным
-- 2. Загрузка изображений будет работать
-- 3. Админ сможет управлять товарами
-- ====================================