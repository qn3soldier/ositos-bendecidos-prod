-- Обновление пароля администратора
-- Пароль: OsitosAdmin2025!
-- Хэш: $2a$10$X7tHrJcPq7GcZzZ9LzYxZ.Y9vH5bKxFjKGqPmYBkKHXm5S9ZvKJmS

UPDATE users
SET password = '$2a$10$X7tHrJcPq7GcZzZ9LzYxZ.Y9vH5bKxFjKGqPmYBkKHXm5S9ZvKJmS'
WHERE email = 'admin@ositos.com';

-- Проверка результата
SELECT id, email, first_name, last_name, role, is_verified, is_active
FROM users
WHERE email = 'admin@ositos.com';