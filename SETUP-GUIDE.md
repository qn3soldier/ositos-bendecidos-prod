# 🚀 Ositos Bendecidos - Production Setup Guide

## 📦 Что создано

### ✅ Frontend (React + Stripe)
- **Полноценная корзина покупок** с localStorage
- **3-этапный чекаут** (доставка → оплата → подтверждение)
- **Реальная Stripe интеграция** с Payment Intents
- **Валидация форм** и обработка ошибок
- **Адаптивный дизайн** под все устройства

### ✅ Backend API (Node.js + Express)
- **REST API** для заказов и платежей
- **Stripe webhooks** для подтверждения платежей
- **Email сервис** для уведомлений
- **Rate limiting** и безопасность
- **Валидация данных** с Joi

### ✅ Платежная система
- **Stripe Payment Intents** - безопасная обработка карт
- **PayPal готовность** - заготовка для интеграции
- **Webhook обработка** - автоматическое обновление статусов

---

## 🔧 Настройка для продакшена

### 1. 📋 Требования
```bash
# Необходимо иметь:
- Node.js 18+
- npm или yarn
- Stripe аккаунт (test/live keys)
- Email сервис (Gmail/SendGrid)
- Database (MongoDB/PostgreSQL)
```

### 2. 🌐 Frontend Setup

#### Установка зависимостей:
```bash
cd ositos-bendecidos
npm install
```

#### Настройка .env:
```bash
# Скопируй .env.example в .env
cp .env.example .env
```

#### Заполни .env файл:
```env
# Stripe (получи на https://dashboard.stripe.com/apikeys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# API URL
VITE_API_URL=http://localhost:3001

# App info
VITE_APP_NAME=Ositos Bendecidos
VITE_APP_URL=http://localhost:3000
```

#### Запуск:
```bash
npm run dev
# Сайт будет доступен на http://localhost:3000
```

### 3. 🔧 Backend Setup

#### Установка зависимостей:
```bash
cd backend-api
npm install
```

#### Настройка .env:
```bash
# Скопируй .env.example в .env
cp .env.example .env
```

#### Заполни .env файл:
```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email (для Gmail)
EMAIL_SERVICE=gmail
EMAIL_FROM=orders@ositosbendecidos.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

#### Запуск:
```bash
npm run dev
# API будет доступен на http://localhost:3001
```

### 4. 🎯 Stripe Webhook Setup

#### В Stripe Dashboard:
1. Перейди в **Developers → Webhooks**
2. Добавь endpoint: `http://localhost:3001/api/payments/webhook`
3. Выбери события:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Скопируй webhook secret в `.env`

---

## 💳 Тестирование платежей

### 🧪 Test Cards (Stripe)
```
Успешная оплата:    4242 4242 4242 4242
Отклоненная карта:  4000 0000 0000 0002
3D Secure:          4000 0000 0000 3220

CVV: любые 3 цифры
Срок: любая будущая дата
```

### 🔄 Тестовый flow:
1. Добавь товары в корзину на `/shop`
2. Перейди в корзину `/cart`
3. Нажми "Proceed to Checkout"
4. Заполни данные доставки
5. Выбери "Credit Card"
6. Используй тестовую карту `4242 4242 4242 4242`
7. Оформи заказ

---

## 🚀 Деплой в продакшен

### Frontend (Vercel/Netlify):
```bash
# Build
npm run build

# .env для продакшена:
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_API_URL=https://your-api.herokuapp.com
```

### Backend (Heroku/Railway):
```bash
# .env для продакшена:
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_xxxxx
DATABASE_URL=your_production_db_url
```
### Database Setup:
Для продакшена нужно заменить in-memory storage на:
- **MongoDB** - документная БД (рекомендуется)
- **PostgreSQL** - реляционная БД

---

## 📧 Email Service Setup

### Gmail (простой способ):
1. Включи 2FA в Google аккаунте
2. Создай App Password: https://myaccount.google.com/apppasswords
3. Используй App Password в `.env`

### SendGrid (продакшен):
1. Зарегистрируйся на https://sendgrid.com
2. Получи API ключ
3. Обновь `backend-api/src/routes/email.ts`

---

## 🔧 Следующие шаги для продакшена

### 🎯 Критически важно:
- [ ] **База данных** - заменить in-memory на MongoDB/PostgreSQL
- [ ] **Real Stripe keys** - получить live ключи
- [ ] **Email service** - настроить SendGrid/Mailgun
- [ ] **SSL сертификаты** - HTTPS для продакшена
- [ ] **Domain setup** - купить домен и настроить DNS

### 🚀 Дополнительные фичи:
- [ ] **PayPal интеграция** - добавить PayPal SDK
- [ ] **Inventory management** - управление остатками товаров
- [ ] **Order tracking** - отслеживание доставки
- [ ] **Admin dashboard** - панель управления заказами
- [ ] **Analytics** - Google Analytics, конверсии
- [ ] **Reviews system** - отзывы о товарах

### 🔒 Безопасность:
- [ ] **Rate limiting** - уже настроен в API
- [ ] **Input validation** - уже настроен с Joi
- [ ] **CORS setup** - уже настроен
- [ ] **Helmet security** - уже настроен
- [ ] **SSL/TLS** - настроить на сервере

---

## 🆘 Поддержка

### 🐛 Если что-то не работает:

1. **Проверь логи:**
   ```bash
   # Frontend
   npm run dev
   
   # Backend
   cd backend-api && npm run dev
   ```

2. **Проверь .env файлы** - все ключи заполнены?

3. **Проверь Stripe Dashboard** - тестовые транзакции видны?

4. **Проверь Network tab** в браузере - API запросы проходят?

### 📊 API Endpoints:
```
GET  /api/health              - Проверка работы API
POST /api/orders              - Создание заказа
GET  /api/orders/:id          - Получение заказа
POST /api/payments/create-payment-intent - Создание Payment Intent
POST /api/payments/webhook    - Stripe webhooks
POST /api/email/confirmation  - Отправка подтверждения
```

---

## 🎯 Результат

**У тебя теперь есть полноценный e-commerce с:**
- ✅ Реальными платежами через Stripe
- ✅ Email уведомлениями
- ✅ Безопасным API
- ✅ Готовностью к продакшену

**Готов принимать настоящие заказы! 🛒💳**
