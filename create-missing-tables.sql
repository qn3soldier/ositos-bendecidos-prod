-- OSITOS BENDECIDOS - CREATE MISSING TABLES
-- Run this in Supabase SQL Editor

-- 1. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_intent_id VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  shipping_address JSONB,
  billing_address JSONB,
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  shipping DECIMAL(10,2),
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  notes TEXT,
  tracking_number VARCHAR(255),
  carrier_name VARCHAR(100),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID,
  product_name VARCHAR(255),
  product_image VARCHAR(500),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Prayer comments table
CREATE TABLE IF NOT EXISTS prayer_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id UUID REFERENCES prayers(id) ON DELETE CASCADE,
  user_id UUID,
  user_name VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Payment intents table
CREATE TABLE IF NOT EXISTS payment_intents (
  id VARCHAR(255) PRIMARY KEY,
  order_id UUID,
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50),
  customer_email VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id VARCHAR(255) PRIMARY KEY,
  payment_intent_id VARCHAR(255),
  amount DECIMAL(10,2),
  reason VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) DEFAULT 'info',
  title VARCHAR(255),
  message TEXT,
  recipients VARCHAR(50) DEFAULT 'all',
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer_id ON prayer_comments(prayer_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_order_id ON payment_intents(order_id);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow service role full access)
CREATE POLICY "Service role has full access to orders" ON orders
  FOR ALL USING (true);

CREATE POLICY "Service role has full access to order_items" ON order_items
  FOR ALL USING (true);

CREATE POLICY "Service role has full access to prayer_comments" ON prayer_comments
  FOR ALL USING (true);

CREATE POLICY "Service role has full access to payment_intents" ON payment_intents
  FOR ALL USING (true);

CREATE POLICY "Service role has full access to refunds" ON refunds
  FOR ALL USING (true);

CREATE POLICY "Service role has full access to notifications" ON notifications
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON orders TO authenticated, anon;
GRANT ALL ON order_items TO authenticated, anon;
GRANT ALL ON prayer_comments TO authenticated, anon;
GRANT ALL ON payment_intents TO authenticated, anon;
GRANT ALL ON refunds TO authenticated, anon;
GRANT ALL ON notifications TO authenticated, anon;

-- Success message
SELECT 'All missing tables created successfully!' as message;