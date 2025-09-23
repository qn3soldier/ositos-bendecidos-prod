-- ИСПРАВЛЯЕМ ПРАВА НА STORAGE BUCKET 'products'
-- Выполни это в Supabase SQL Editor

-- Удаляем старые политики
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Создаем новые политики для bucket 'products'
-- 1. Публичный доступ на чтение
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

-- 2. Любой аутентифицированный пользователь может загружать
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- 3. Любой аутентифицированный пользователь может обновлять
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- 4. Любой аутентифицированный пользователь может удалять
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- Проверяем что bucket существует и публичный
UPDATE storage.buckets
SET public = true
WHERE id = 'products';