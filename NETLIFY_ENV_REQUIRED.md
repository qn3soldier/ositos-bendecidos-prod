# NETLIFY ENVIRONMENT VARIABLES - ОБЯЗАТЕЛЬНО НАСТРОИТЬ!

## 🔴🔴🔴 КРИТИЧНО: БЕЗ ЭТОГО CHECKOUT НЕ РАБОТАЕТ!

### ОБЯЗАТЕЛЬНО добавьте в Netlify Dashboard → Site Settings → Environment Variables:

```
FRONTEND_URL = https://ositosbendecidos.com
```

⚠️ **БЕЗ ЭТОЙ ПЕРЕМЕННОЙ ПОКУПКИ В МАГАЗИНЕ НЕ БУДУТ РАБОТАТЬ!**

## Все необходимые переменные окружения для Netlify:

### 1. Frontend URL (КРИТИЧНО - БЕЗ ЭТОГО CHECKOUT НЕ РАБОТАЕТ!)
```
FRONTEND_URL = https://ositosbendecidos.com
```

### 2. Supabase
```
VITE_SUPABASE_URL = https://rqqqkquovwvsegaluxwe.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcXFrcXVvdnd2c2VnYWx1eHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQyMjc2MzgsImV4cCI6MjAzOTgwMzYzOH0.s49rpLo-oNjpKMwKBQkvVdVfXeF1oYlNGz_GCKqwvDU
SUPABASE_SERVICE_ROLE_KEY = [ваш service role key]
```

### 3. JWT Secret
```
JWT_SECRET = your-super-secret-key-min-32-chars-long-for-security
```

### 4. Stripe
```
STRIPE_SECRET_KEY = sk_test_51Rxev64jzk7OQLta...
VITE_STRIPE_PUBLISHABLE_KEY = pk_test_51Rxev64jzk7OQLtaEb1BFCCmOd42b37RYWGpHSBjbWyRZIlD1eecn6sfIy5qE0PWbQMakPfzidc6ZtfcciSv94nS00M4IYG5zF
STRIPE_WEBHOOK_SECRET = whsec_ddGL9umuCBmdh9okbs1VcGKPZBZfZmr1
STRIPE_WEBHOOK_SECRET_ORDERS = whsec_[webhook secret для orders]
```

## 📝 Как добавить переменные:

1. Зайдите в [Netlify Dashboard](https://app.netlify.com)
2. Выберите сайт `ositosbendecidos`
3. Перейдите в **Site configuration** → **Environment variables**
4. Нажмите **Add a variable**
5. Введите имя переменной (Key) и значение (Value)
6. Нажмите **Add**
7. После добавления всех переменных - **Trigger Deploy** для применения изменений

## ⚠️ ВАЖНО:

- **FRONTEND_URL** - ОБЯЗАТЕЛЬНО добавить, иначе checkout будет выдавать ошибку "Not a valid URL"
- Все переменные начинающиеся с `VITE_` будут доступны на frontend
- Остальные переменные доступны только в Netlify Functions (backend)
- После добавления переменных сделайте redeploy сайта

## 🔍 Проверка:

После добавления переменных и деплоя проверьте:
1. Checkout в магазине (должен работать без ошибки 500)
2. Страница /donate (должна показывать Stripe Payment Element)
3. Community donations (должны обрабатываться корректно)

---
*Создано: 23.09.2025*
*КРИТИЧНО: Без FRONTEND_URL checkout не работает!*