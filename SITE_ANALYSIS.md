# OSITOS BENDECIDOS - ПОЛНЫЙ АНАЛИЗ ФУНКЦИОНАЛЬНОСТИ

## 🎯 ОБЗОР ПРОЕКТА
E-commerce платформа с религиозной тематикой, включающая:
- Магазин товаров
- Молитвенную доску
- Систему пожертвований
- Сообщество и помощь нуждающимся
- Отзывы и истории успеха
- Админ панель

## 📱 СТРАНИЦЫ И ФУНКЦИОНАЛЬНОСТЬ

### 1. HOME (Главная)
- **Компонент:** `src/components/pages/Home/Home.tsx`
- **Функции:**
  - Hero секция с призывом к действию
  - Витрина популярных товаров
  - Блок с миссией организации
  - Последние молитвенные просьбы
  - Статистика помощи

### 2. SHOP (Магазин)
- **Компонент:** `src/components/pages/Shop/Shop.tsx`
- **API endpoints:**
  - `GET /api/products` - получить все товары
  - `GET /api/products/:id` - получить товар по ID
  - `GET /api/products/meta/categories` - получить категории
- **Функции:**
  - Фильтрация по категориям
  - Поиск товаров
  - Добавление в корзину
  - Рейтинг и отзывы товаров
- **Категории товаров:**
  - clothing (одежда)
  - accessories (аксессуары)
  - books (книги)
  - care (помощь)

### 3. CART (Корзина)
- **Компонент:** `src/components/pages/Cart/Cart.tsx`
- **Context:** `src/contexts/CartContext.tsx`
- **Функции:**
  - Добавление/удаление товаров
  - Изменение количества
  - Расчет суммы
  - Применение скидок
  - Переход к оформлению

### 4. CHECKOUT (Оформление заказа)
- **Компонент:** `src/components/pages/Checkout/Checkout.tsx`
- **API endpoints:**
  - `POST /api/orders` - создать заказ
  - `POST /api/payments/create-intent` - создать платежный интент
- **Функции:**
  - Форма доставки
  - Выбор способа оплаты (Stripe/PayPal)
  - Расчет доставки и налогов
  - Подтверждение заказа

### 5. PRAYER BOARD (Молитвенная доска)
- **Компонент:** `src/components/pages/PrayerBoard/PrayerBoard.tsx`
- **API endpoints:**
  - `GET /api/prayers` - получить все молитвы
  - `POST /api/prayers` - создать молитву
  - `POST /api/prayers/:id/pray` - помолиться за кого-то
  - `POST /api/prayers/:id/comment` - оставить комментарий
  - `GET /api/prayers/:id/interactions?type=comment` - получить комментарии
- **Функции:**
  - Публикация молитвенных просьб
  - Анонимные и публичные молитвы
  - Счетчик молитв
  - Комментарии поддержки
  - Фильтрация по категориям

### 6. COMMUNITY (Сообщество)
- **Компонент:** `src/components/pages/Community/Community.tsx`
- **API endpoints:**
  - `GET /api/community/requests` - получить запросы помощи
  - `POST /api/community/requests/:id/donate` - сделать пожертвование
- **Функции:**
  - Запросы помощи от нуждающихся
  - Прогресс сбора средств
  - Истории бенефициаров
  - Форма пожертвования
  - Категории помощи (medical, education, business)

### 7. TESTIMONIALS (Отзывы)
- **Компонент:** `src/components/pages/Testimonials/Testimonials.tsx`
- **API endpoints:**
  - `GET /api/testimonials` - получить отзывы
  - `POST /api/testimonials` - отправить отзыв
- **Функции:**
  - Истории успеха
  - Форма отправки отзыва
  - Фильтрация по категориям
  - Верификация отзывов

### 8. AUTHENTICATION (Авторизация)
- **Компонент:** `src/components/global/AuthModals/AuthModals.tsx`
- **Context:** `src/contexts/AuthContext.tsx`
- **API endpoints:**
  - `POST /api/auth/register` - регистрация
  - `POST /api/auth/login` - вход
  - `POST /api/auth/refresh` - обновление токена
  - `POST /api/auth/logout` - выход
- **Функции:**
  - Регистрация с email/password
  - Вход в систему
  - JWT токены (access + refresh)
  - Сессии пользователей
  - Роли (user, admin)

### 9. ADMIN PANEL (Админ панель)
- **Компоненты:**
  - `src/components/pages/Admin/AdminLogin.tsx`
  - `src/components/pages/Admin/AdminDashboard.tsx`
  - `src/components/pages/Admin/AdminPanel.tsx`
- **API endpoints:**
  - `GET /api/admin/stats/overview` - статистика
  - `GET /api/admin/users` - управление пользователями
  - `GET /api/admin/orders` - управление заказами
  - `PUT /api/admin/products/:id` - редактирование товаров
- **Функции:**
  - Статистика продаж
  - Управление товарами
  - Управление заказами
  - Модерация молитв и отзывов
  - Управление пользователями

## 📊 СТРУКТУРА БАЗЫ ДАННЫХ

### 1. USERS (Пользователи)
```sql
- id (UUID, PK)
- email (unique)
- password_hash
- first_name
- last_name
- display_name
- avatar_url
- role (user/admin)
- is_verified
- is_active
- phone
- address (JSON)
- email_notifications
- push_notifications
- created_at
- updated_at
- last_login_at
```

### 2. PRODUCTS (Товары)
```sql
- id (UUID, PK)
- name
- description
- price
- category
- subcategory
- tags (array)
- image_url
- images (JSON)
- sku
- in_stock
- inventory_count
- featured
- rating
- reviews_count
- sold_count
- status (active/inactive)
- created_at
- updated_at
```

### 3. ORDERS (Заказы)
```sql
- id (UUID, PK)
- order_number (unique)
- user_id (FK -> users)
- status (pending/processing/shipped/delivered/cancelled)
- payment_status
- payment_method
- payment_intent_id
- customer_email
- customer_name
- customer_phone
- shipping_address (JSON)
- billing_address (JSON)
- subtotal
- tax
- shipping
- discount
- total
- currency
- notes
- tracking_number
- shipped_at
- delivered_at
- paid_at
- created_at
- updated_at
```

### 4. ORDER_ITEMS (Позиции заказа)
```sql
- id (UUID, PK)
- order_id (FK -> orders)
- product_id (FK -> products)
- product_name
- product_image
- quantity
- price
- total
- created_at
```

### 5. PRAYERS (Молитвы)
```sql
- id (UUID, PK)
- user_id (FK -> users, nullable)
- user_name
- title
- content
- category
- is_anonymous
- is_public
- is_answered
- is_featured
- prayer_count
- support_count
- comment_count
- status (pending/approved/rejected)
- created_at
- updated_at
```

### 6. PRAYER_INTERACTIONS (Взаимодействия с молитвами)
```sql
- id (UUID, PK)
- prayer_id (FK -> prayers)
- user_id (FK -> users, nullable)
- user_name
- interaction_type (pray/support/comment)
- message
- created_at
```

### 7. COMMUNITY_REQUESTS (Запросы помощи)
```sql
- id (UUID, PK)
- user_id (FK -> users)
- title
- description
- category (medical/education/business/emergency)
- target_amount
- raised_amount
- currency
- beneficiary_info (JSON)
- verification_status
- is_featured
- donor_count
- deadline
- status (pending/active/completed/cancelled)
- created_at
- updated_at
```

### 8. DONATIONS (Пожертвования)
```sql
- id (UUID, PK)
- request_id (FK -> community_requests)
- donor_id (FK -> users, nullable)
- donor_name
- donor_email
- amount
- currency
- payment_method
- payment_intent_id
- is_anonymous
- message
- status (pending/completed/failed/refunded)
- created_at
```

### 9. TESTIMONIALS (Отзывы)
```sql
- id (UUID, PK)
- user_id (FK -> users, nullable)
- name
- email
- location
- story
- impact_category
- images (JSON)
- video_url
- is_verified
- is_featured
- status (pending/approved/rejected)
- tags (array)
- created_at
- updated_at
```

### 10. PAYMENTS (Платежи)
```sql
- id (UUID, PK)
- order_id (FK -> orders)
- payment_intent_id
- payment_method
- amount
- currency
- status
- provider (stripe/paypal)
- metadata (JSON)
- created_at
- updated_at
```

### 11. CART_ITEMS (Корзина - опционально)
```sql
- id (UUID, PK)
- user_id (FK -> users)
- product_id (FK -> products)
- quantity
- created_at
- updated_at
```

### 12. REVIEWS (Отзывы о товарах)
```sql
- id (UUID, PK)
- product_id (FK -> products)
- user_id (FK -> users)
- rating (1-5)
- comment
- is_verified_purchase
- created_at
- updated_at
```

### 13. NOTIFICATIONS (Уведомления)
```sql
- id (UUID, PK)
- user_id (FK -> users, nullable for broadcast)
- type (order/prayer/donation/system)
- title
- message
- is_read
- created_at
```

## 🔐 БЕЗОПАСНОСТЬ И ПРАВА ДОСТУПА

### Row Level Security (RLS) политики:
1. **Users** - пользователи видят только свои данные, админы видят всё
2. **Orders** - пользователи видят только свои заказы
3. **Prayers** - публичные молитвы видны всем, приватные только автору
4. **Donations** - анонимные скрыты, остальные видны
5. **Admin** - полный доступ ко всем таблицам

### API Security:
- JWT токены для аутентификации
- Refresh токены для обновления сессии
- Rate limiting на API endpoints
- CORS настройки
- Валидация входных данных

## 🚀 ИНТЕГРАЦИИ

1. **Supabase** - база данных и аутентификация
2. **Stripe** - платежи картами
3. **PayPal** - альтернативные платежи
4. **SendGrid/Resend** - email уведомления
5. **Cloudinary** - хранение изображений

## 📝 ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ

1. **Multi-language** - поддержка испанского и английского
2. **Responsive** - адаптивный дизайн
3. **PWA** - работа офлайн
4. **SEO** - оптимизация для поисковиков
5. **Analytics** - Google Analytics / Plausible
6. **A11y** - доступность для людей с ограничениями