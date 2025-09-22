-- ПРАВИЛЬНАЯ структура для e-commerce с Stripe
-- products таблица уже существует, добавляем только orders

-- 1. Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Stripe данные
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_checkout_session_id VARCHAR(255),

    -- Информация о клиенте (для гостевого checkout тоже)
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),

    -- Адрес доставки
    shipping_address JSONB NOT NULL, -- {street, city, state, zip, country}

    -- Статусы
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, succeeded, failed, refunded
    fulfillment_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled

    -- Суммы (дублируем из Stripe для быстрого доступа)
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,

    -- Tracking
    tracking_number VARCHAR(255),
    shipped_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблица товаров в заказе
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Снимок товара на момент покупки (если товар удалят/изменят)
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    product_image VARCHAR(500),

    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL, -- price * quantity

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Для главной страницы донатов (опционально, можно использовать существующую donations)
CREATE TABLE IF NOT EXISTS general_donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Stripe reference
    stripe_payment_intent_id VARCHAR(255) UNIQUE,

    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Donor info
    donor_name VARCHAR(255) DEFAULT 'Anonymous',
    donor_email VARCHAR(255),
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,

    -- Purpose
    purpose VARCHAR(100) DEFAULT 'general_fund', -- general_fund, education, medical, emergency

    status VARCHAR(50) DEFAULT 'pending', -- pending, succeeded, failed, refunded

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_general_donations_status ON general_donations(status);

-- Trigger для updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Функция для уменьшения stock при создании заказа
CREATE OR REPLACE FUNCTION decrease_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger будет активирован только после подтверждения оплаты
-- CREATE TRIGGER decrease_stock_on_order
-- AFTER INSERT ON order_items
-- FOR EACH ROW EXECUTE FUNCTION decrease_product_stock();