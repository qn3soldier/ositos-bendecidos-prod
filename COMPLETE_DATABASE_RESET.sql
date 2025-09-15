-- OSITOS BENDECIDOS - ПОЛНЫЙ СБРОС И ПЕРЕСОЗДАНИЕ БАЗЫ ДАННЫХ
-- ВНИМАНИЕ: ЭТО УДАЛИТ ВСЕ ДАННЫЕ!

-- ========================================
-- 1. УДАЛЕНИЕ ВСЕХ СУЩЕСТВУЮЩИХ ТАБЛИЦ
-- ========================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS community_requests CASCADE;
DROP TABLE IF EXISTS prayer_interactions CASCADE;
DROP TABLE IF EXISTS prayer_comments CASCADE;
DROP TABLE IF EXISTS prayers CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS payment_intents CASCADE;

-- ========================================
-- 2. ВКЛЮЧЕНИЕ РАСШИРЕНИЙ
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- для полнотекстового поиска

-- ========================================
-- 3. СОЗДАНИЕ ТАБЛИЦ
-- ========================================

-- USERS - Основная таблица пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Хэшированный пароль
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    avatar_url VARCHAR(500),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    phone VARCHAR(50),
    address JSONB DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'es' CHECK (language IN ('es', 'en')),
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS - Каталог товаров
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    image_url VARCHAR(500),
    images JSONB DEFAULT '[]',
    sku VARCHAR(100) UNIQUE,
    in_stock BOOLEAN DEFAULT true,
    inventory_count INTEGER DEFAULT 0 CHECK (inventory_count >= 0),
    featured BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDERS - Заказы
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL DEFAULT CONCAT('ORD-', TO_CHAR(NOW(), 'YYYYMMDD'), '-', LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50) CHECK (payment_method IN ('stripe', 'paypal', 'cash')),
    payment_intent_id VARCHAR(255),
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tax DECIMAL(10,2) DEFAULT 0 CHECK (tax >= 0),
    shipping DECIMAL(10,2) DEFAULT 0 CHECK (shipping >= 0),
    discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    notes TEXT,
    tracking_number VARCHAR(255),
    carrier_name VARCHAR(100),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDER_ITEMS - Позиции в заказе
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(500),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRAYERS - Молитвенные просьбы
CREATE TABLE prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    title VARCHAR(255),
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    is_anonymous BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    is_answered BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    prayer_count INTEGER DEFAULT 0,
    support_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    answered_at TIMESTAMP WITH TIME ZONE,
    featured_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRAYER_INTERACTIONS - Взаимодействия с молитвами
CREATE TABLE prayer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prayer_id UUID NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('pray', 'support', 'comment', 'view')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COMMUNITY_REQUESTS - Запросы помощи от сообщества
CREATE TABLE community_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('medical', 'education', 'business', 'emergency', 'other')),
    target_amount DECIMAL(10,2) NOT NULL CHECK (target_amount > 0),
    raised_amount DECIMAL(10,2) DEFAULT 0 CHECK (raised_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    beneficiary_info JSONB NOT NULL,
    supporting_documents JSONB DEFAULT '[]',
    image_url VARCHAR(500),
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    deadline DATE,
    is_featured BOOLEAN DEFAULT false,
    donor_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- DONATIONS - Пожертвования
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES community_requests(id) ON DELETE SET NULL,
    community_request_id UUID REFERENCES community_requests(id) ON DELETE SET NULL, -- alias для совместимости
    donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    donor_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- alias для совместимости
    donor_name VARCHAR(255) NOT NULL,
    donor_email VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) CHECK (payment_method IN ('stripe', 'paypal', 'cash')),
    payment_id VARCHAR(255),
    payment_intent_id VARCHAR(255),
    transaction_id VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT false,
    message TEXT,
    receipt_url VARCHAR(500),
    tax_deductible BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TESTIMONIALS - Отзывы и истории успеха
CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    location VARCHAR(255),
    story TEXT NOT NULL,
    impact_category VARCHAR(100),
    before_situation TEXT,
    after_situation TEXT,
    image_url VARCHAR(500),
    images JSONB DEFAULT '[]',
    video_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    featured_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAYMENTS - Детали платежей
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,
    payment_intent_id VARCHAR(255) UNIQUE,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'paypal')),
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REVIEWS - Отзывы о товарах
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    images JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTIFICATIONS - Уведомления пользователей
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('order', 'prayer', 'donation', 'system', 'info')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipients VARCHAR(50) DEFAULT 'user',
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CART_ITEMS - Корзина (опционально, можно хранить в localStorage)
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ========================================
-- 4. СОЗДАНИЕ ИНДЕКСОВ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ========================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Products indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX idx_products_in_stock ON products(in_stock) WHERE in_stock = true;
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Prayers indexes
CREATE INDEX idx_prayers_user_id ON prayers(user_id);
CREATE INDEX idx_prayers_status ON prayers(status);
CREATE INDEX idx_prayers_is_public ON prayers(is_public) WHERE is_public = true;
CREATE INDEX idx_prayers_created_at ON prayers(created_at DESC);

-- Prayer interactions indexes
CREATE INDEX idx_prayer_interactions_prayer_id ON prayer_interactions(prayer_id);
CREATE INDEX idx_prayer_interactions_user_id ON prayer_interactions(user_id);
CREATE INDEX idx_prayer_interactions_type ON prayer_interactions(interaction_type);

-- Community requests indexes
CREATE INDEX idx_community_requests_status ON community_requests(status);
CREATE INDEX idx_community_requests_category ON community_requests(category);
CREATE INDEX idx_community_requests_verification_status ON community_requests(verification_status);
CREATE INDEX idx_community_requests_is_featured ON community_requests(is_featured) WHERE is_featured = true;

-- Donations indexes
CREATE INDEX idx_donations_request_id ON donations(request_id);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);

-- Testimonials indexes
CREATE INDEX idx_testimonials_status ON testimonials(status);
CREATE INDEX idx_testimonials_is_featured ON testimonials(is_featured) WHERE is_featured = true;
CREATE INDEX idx_testimonials_is_verified ON testimonials(is_verified) WHERE is_verified = true;

-- Reviews indexes
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Cart indexes
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- ========================================
-- 5. СОЗДАНИЕ ТРИГГЕРОВ
-- ========================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Применяем триггер ко всем таблицам с updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prayers_updated_at BEFORE UPDATE ON prayers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_requests_updated_at BEFORE UPDATE ON community_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для обновления inventory_count при создании заказа
CREATE OR REPLACE FUNCTION update_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products
        SET inventory_count = inventory_count - NEW.quantity,
            sold_count = sold_count + NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_on_order
AFTER INSERT ON order_items
FOR EACH ROW EXECUTE FUNCTION update_product_inventory();

-- Триггер для обновления счетчиков в prayers
CREATE OR REPLACE FUNCTION update_prayer_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.interaction_type = 'pray' THEN
            UPDATE prayers SET prayer_count = prayer_count + 1 WHERE id = NEW.prayer_id;
        ELSIF NEW.interaction_type = 'support' THEN
            UPDATE prayers SET support_count = support_count + 1 WHERE id = NEW.prayer_id;
        ELSIF NEW.interaction_type = 'comment' THEN
            UPDATE prayers SET comment_count = comment_count + 1 WHERE id = NEW.prayer_id;
        ELSIF NEW.interaction_type = 'view' THEN
            UPDATE prayers SET views_count = views_count + 1 WHERE id = NEW.prayer_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prayer_counters_on_interaction
AFTER INSERT ON prayer_interactions
FOR EACH ROW EXECUTE FUNCTION update_prayer_counters();

-- Триггер для обновления raised_amount в community_requests
CREATE OR REPLACE FUNCTION update_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE community_requests
        SET raised_amount = raised_amount + NEW.amount,
            donor_count = donor_count + 1
        WHERE id = NEW.request_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_raised_amount_on_donation
AFTER INSERT ON donations
FOR EACH ROW EXECUTE FUNCTION update_raised_amount();

-- ========================================
-- 6. ВКЛЮЧЕНИЕ ROW LEVEL SECURITY
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. СОЗДАНИЕ RLS ПОЛИТИК
-- ========================================

-- Политики для service role (полный доступ для backend)
CREATE POLICY "Service role full access" ON users FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON products FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON orders FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON order_items FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON prayers FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON prayer_interactions FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON community_requests FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON donations FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON testimonials FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON payments FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON reviews FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON cart_items FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Политики для обычных пользователей будут добавлены позже

-- ========================================
-- 8. СОЗДАНИЕ НАЧАЛЬНЫХ ДАННЫХ
-- ========================================

-- Создаем тестового админа
INSERT INTO users (email, password, first_name, last_name, role, is_verified, is_active)
VALUES ('admin@ositos.com', '$2a$10$YourHashedPasswordHere', 'Admin', 'User', 'admin', true, true);

-- Создаем категории товаров
INSERT INTO products (name, description, price, category, image_url, in_stock, inventory_count, featured) VALUES
('Blessed Bear T-Shirt', 'Comfortable 100% cotton t-shirt featuring our beloved Ositos Bendecidos bear design', 29.99, 'clothing', '/images/products/tshirt.jpg', true, 50, true),
('Faith & Hope Coffee Mug', 'Ceramic mug with "God''s blessing is the best value, it''s free" quote', 19.99, 'accessories', '/images/products/mug.jpg', true, 30, false),
('Daily Prayer Journal', 'Beautiful leather-bound journal for daily prayers and spiritual growth', 24.99, 'books', '/images/products/journal.jpg', true, 25, false),
('Blessed Bear Hoodie', 'Warm fleece hoodie with golden bear embroidery', 49.99, 'clothing', '/images/products/hoodie.jpg', true, 20, true),
('Community Care Package', 'Full care package to support a family in need', 75.00, 'care', '/images/products/care-package.jpg', true, 10, true);

-- ========================================
-- 9. GRANT PERMISSIONS
-- ========================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- ========================================
-- ФИНАЛЬНАЯ ПРОВЕРКА
-- ========================================

SELECT 'Database reset complete!' as status;
SELECT table_name, 'created' as status FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;