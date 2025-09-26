# 🚀 STRIPE PRODUCTION MIGRATION GUIDE

## ⚠️ ВАЖНО: Переход на Production ключи Stripe

### 📋 Что нужно заменить в Netlify Environment Variables:

#### 1. **STRIPE_SECRET_KEY**
- **Текущий (test):** `sk_test_...`
- **Новый (production):** `sk_live_...`
- **Где получить:** Stripe Dashboard → Developers → API Keys → Secret key (live mode)

#### 2. **VITE_STRIPE_PUBLISHABLE_KEY**
- **Текущий (test):** `pk_test_...`
- **Новый (production):** `pk_live_...`
- **Где получить:** Stripe Dashboard → Developers → API Keys → Publishable key (live mode)

#### 3. **STRIPE_WEBHOOK_SECRET**
- **Текущий (test):** `whsec_...` (для test webhook)
- **Новый (production):** `whsec_...` (для production webhook)
- **Как настроить:**
  1. Stripe Dashboard → Developers → Webhooks
  2. Переключиться на "Live mode" (вверху справа)
  3. Add endpoint → URL: `https://[YOUR-DOMAIN]/.netlify/functions/stripe-webhook`
  4. Events to listen:
     - `payment_intent.succeeded`
     - `checkout.session.completed`
  5. После создания → Reveal signing secret → скопировать

#### 4. **STRIPE_WEBHOOK_SECRET_ORDERS**
- **Текущий (test):** `whsec_...` (для test webhook)
- **Новый (production):** `whsec_...` (для production webhook)
- **Как настроить:**
  1. Stripe Dashboard → Developers → Webhooks (Live mode)
  2. Add endpoint → URL: `https://[YOUR-DOMAIN]/.netlify/functions/stripe-webhook-orders`
  3. Events to listen:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
  4. После создания → Reveal signing secret → скопировать

### 🔄 Порядок действий:

1. **Получить Production ключи:**
   - Войти в Stripe Dashboard
   - Переключиться на "Live mode" (переключатель вверху справа)
   - Перейти в Developers → API Keys
   - Скопировать Publishable key и Secret key

2. **Создать Production Webhooks:**
   - В Stripe Dashboard (Live mode) → Developers → Webhooks
   - Создать 2 webhook endpoints (см. выше)
   - Скопировать signing secrets

3. **Обновить Netlify Environment Variables:**
   ```
   STRIPE_SECRET_KEY = sk_live_YOUR_LIVE_SECRET_KEY
   VITE_STRIPE_PUBLISHABLE_KEY = pk_live_YOUR_LIVE_PUBLISHABLE_KEY
   STRIPE_WEBHOOK_SECRET = whsec_YOUR_LIVE_WEBHOOK_SECRET
   STRIPE_WEBHOOK_SECRET_ORDERS = whsec_YOUR_LIVE_WEBHOOK_SECRET_ORDERS
   ```

4. **Передеплоить сайт:**
   - В Netlify Dashboard → Deploys → Trigger deploy

### ✅ Проверка после миграции:

1. **Тестовый платеж:**
   - Сделать небольшую покупку ($1-2)
   - Проверить что платеж прошел
   - Проверить что заказ создан в БД
   - Проверить Stripe Dashboard (Live mode) - платеж должен появиться

2. **Проверить webhooks:**
   - Stripe Dashboard → Webhooks → проверить что события доставляются (200 OK)

3. **Проверить логи:**
   - Netlify → Functions → проверить логи функций

### ⚠️ КРИТИЧЕСКИ ВАЖНО:

1. **НЕ УДАЛЯЙТЕ test ключи сразу** - сохраните их на случай отката
2. **Проверьте что у вас активирован Stripe аккаунт** для приема реальных платежей
3. **Убедитесь что настроены все необходимые данные компании** в Stripe
4. **Проверьте лимиты и комиссии** для вашего региона

### 📞 Поддержка:
- Stripe Support: https://support.stripe.com
- Документация: https://stripe.com/docs

### 🔒 Безопасность:
- НИКОГДА не коммитьте production ключи в git
- Используйте только Environment Variables
- Регулярно ротируйте ключи (раз в 3-6 месяцев)

---
*Создано: 25.09.2025*
*Статус: Готово к миграции на production*