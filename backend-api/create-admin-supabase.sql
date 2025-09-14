-- Create Admin User in Supabase
-- Execute this in Supabase SQL Editor

-- Create admin user in public.users table
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    email_verified,
    email_verified_at,
    password_hash,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin@ositos.com',
    'Admin',
    'User',
    'admin',
    'active',
    true,
    NOW(),
    '$2a$12$YourHashedPasswordHere', -- Will be set via auth
    NOW(),
    NOW()
) ON CONFLICT (email) 
DO UPDATE SET 
    role = 'admin',
    status = 'active',
    updated_at = NOW();

-- For Supabase Auth, create user via Dashboard or use this:
-- Go to Authentication > Users > Invite User
-- Email: admin@ositos.com
-- Password: Set a strong password

-- After creating user in Supabase Auth, update the user ID in public.users:
-- UPDATE public.users 
-- SET id = 'YOUR-AUTH-USER-ID-HERE'
-- WHERE email = 'admin@ositos.com';

-- Verify admin user was created
SELECT 
    id,
    email,
    first_name || ' ' || last_name as full_name,
    role,
    status,
    created_at
FROM public.users 
WHERE email = 'admin@ositos.com';