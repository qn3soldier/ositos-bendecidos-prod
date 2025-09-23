-- Добавление недостающей колонки fulfillment_status в таблицу orders
-- Эта колонка требуется для webhook обработки Stripe

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) DEFAULT 'pending';

-- Комментарий: fulfillment_status отслеживает статус выполнения заказа
-- Возможные значения: pending, processing, shipped, delivered, cancelled