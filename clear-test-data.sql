-- Удаляем тестовые данные из community_requests
DELETE FROM community_requests
WHERE title IN (
  'Small Bakery Equipment for Single Mom',
  'Medical Bills for Senior Citizen',
  'College Fund for Promising Student'
);

-- Удаляем тестовые данные из products
DELETE FROM products
WHERE name IN (
  'Blessed Bear T-Shirt',
  'Prayer Journal',
  'Hope Bracelet',
  'Faith Mug',
  'Community Cookbook'
);

-- Удаляем тестовые данные из testimonials
DELETE FROM testimonials
WHERE name IN (
  'Maria Rodriguez',
  'James Thompson',
  'Ana Chen'
);

-- Удаляем тестовые молитвы
DELETE FROM prayers
WHERE user_name IN (
  'Maria S.',
  'John D.',
  'Anonymous'
);

-- Проверяем что осталось
SELECT 'community_requests' as table_name, COUNT(*) as count FROM community_requests
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'testimonials', COUNT(*) FROM testimonials
UNION ALL
SELECT 'prayers', COUNT(*) FROM prayers;