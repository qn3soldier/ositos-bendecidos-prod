-- Supabase Database Setup for Ositos Bendecidos
-- Run this SQL in your Supabase SQL Editor

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can do everything" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, is_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default admin user (you'll need to create this user through Supabase Auth first)
-- This is just a placeholder - you'll update it with the actual UUID after creating the admin user
-- INSERT INTO public.users (id, email, first_name, last_name, is_verified, role)
-- VALUES (
--   'YOUR_ADMIN_UUID_HERE',
--   'admin@ositos.com',
--   'Admin',
--   'User',
--   TRUE,
--   'admin'
-- );

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Create a view for easier querying
CREATE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  is_verified,
  avatar_url,
  role,
  created_at,
  updated_at,
  last_login_at
FROM public.users;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;

-- Grant admin users additional permissions
GRANT ALL ON public.users TO service_role;

COMMENT ON TABLE public.users IS 'Extended user profiles linked to Supabase auth.users';
COMMENT ON COLUMN public.users.id IS 'Foreign key to auth.users.id';
COMMENT ON COLUMN public.users.role IS 'User role: user or admin';
COMMENT ON COLUMN public.users.is_verified IS 'Whether user has verified their email';

-- =========================================
-- PRODUCTS TABLE
-- =========================================

CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  in_stock BOOLEAN DEFAULT TRUE,
  inventory_count INTEGER DEFAULT 0 CHECK (inventory_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage products" ON public.products
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================
-- PRAYERS TABLE
-- =========================================

CREATE TABLE public.prayers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT, -- For anonymous prayers or display name
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  prayer_count INTEGER DEFAULT 0 CHECK (prayer_count >= 0),
  comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'reported')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for prayers
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

-- Prayers policies
CREATE POLICY "Anyone can view active prayers" ON public.prayers
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create prayers" ON public.prayers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update own prayers" ON public.prayers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage prayers" ON public.prayers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =========================================
-- PRAYER INTERACTIONS TABLE
-- =========================================

CREATE TABLE public.prayer_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_id UUID REFERENCES public.prayers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('pray', 'comment')),
  comment_text TEXT, -- Only for comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prayer_id, user_id, interaction_type)
);

-- Enable RLS for prayer interactions
ALTER TABLE public.prayer_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prayer interactions" ON public.prayer_interactions
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create interactions" ON public.prayer_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =========================================
-- COMMUNITY REQUESTS TABLE
-- =========================================

CREATE TABLE public.community_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_amount DECIMAL(10,2) DEFAULT 0 CHECK (target_amount >= 0),
  raised_amount DECIMAL(10,2) DEFAULT 0 CHECK (raised_amount >= 0),
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  beneficiary_info JSONB, -- Flexible field for beneficiary details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deadline TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for community requests
ALTER TABLE public.community_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active community requests" ON public.community_requests
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage community requests" ON public.community_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create community requests" ON public.community_requests
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- =========================================
-- DONATIONS TABLE
-- =========================================

CREATE TABLE public.donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_request_id UUID REFERENCES public.community_requests(id),
  donor_user_id UUID REFERENCES auth.users(id),
  donor_name TEXT, -- For anonymous donations
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  is_anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  payment_method TEXT,
  payment_id TEXT, -- PayPal/Stripe transaction ID
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view own donations" ON public.donations
  FOR SELECT USING (donor_user_id = auth.uid());

CREATE POLICY "Anyone can view anonymous donation stats" ON public.donations
  FOR SELECT USING (is_anonymous = TRUE);

CREATE POLICY "Admins can view all donations" ON public.donations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create donations" ON public.donations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (donor_user_id = auth.uid() OR donor_user_id IS NULL)
  );

-- =========================================
-- TESTIMONIALS TABLE
-- =========================================

CREATE TABLE public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  story TEXT NOT NULL,
  image_url TEXT,
  location TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for testimonials
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials" ON public.testimonials
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own testimonials" ON public.testimonials
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage testimonials" ON public.testimonials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =========================================
-- FUNCTIONS AND TRIGGERS
-- =========================================

-- Update prayer count when interaction is added/removed
CREATE OR REPLACE FUNCTION update_prayer_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.interaction_type = 'pray' THEN
      UPDATE public.prayers 
      SET prayer_count = prayer_count + 1 
      WHERE id = NEW.prayer_id;
    ELSIF NEW.interaction_type = 'comment' THEN
      UPDATE public.prayers 
      SET comment_count = comment_count + 1 
      WHERE id = NEW.prayer_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.interaction_type = 'pray' THEN
      UPDATE public.prayers 
      SET prayer_count = prayer_count - 1 
      WHERE id = OLD.prayer_id;
    ELSIF OLD.interaction_type = 'comment' THEN
      UPDATE public.prayers 
      SET comment_count = comment_count - 1 
      WHERE id = OLD.prayer_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for prayer counts
CREATE TRIGGER on_prayer_interaction_change
  AFTER INSERT OR DELETE ON public.prayer_interactions
  FOR EACH ROW EXECUTE FUNCTION update_prayer_counts();

-- Update community request raised amount when donation is completed
CREATE OR REPLACE FUNCTION update_community_request_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    UPDATE public.community_requests 
    SET raised_amount = raised_amount + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.community_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    UPDATE public.community_requests 
    SET raised_amount = raised_amount + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.community_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' THEN
    UPDATE public.community_requests 
    SET raised_amount = raised_amount - OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.community_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'completed' THEN
    UPDATE public.community_requests 
    SET raised_amount = raised_amount - OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.community_request_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for donation amount updates
CREATE TRIGGER on_donation_status_change
  AFTER INSERT OR UPDATE OR DELETE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION update_community_request_amount();

-- Add updated_at triggers for all tables
CREATE TRIGGER on_products_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_prayers_updated
  BEFORE UPDATE ON public.prayers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_community_requests_updated
  BEFORE UPDATE ON public.community_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_testimonials_updated
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Products indexes
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_in_stock ON public.products(in_stock);
CREATE INDEX idx_products_created_at ON public.products(created_at);

-- Prayers indexes
CREATE INDEX idx_prayers_status ON public.prayers(status);
CREATE INDEX idx_prayers_created_at ON public.prayers(created_at DESC);
CREATE INDEX idx_prayers_user_id ON public.prayers(user_id);
CREATE INDEX idx_prayers_tags ON public.prayers USING gin(tags);

-- Prayer interactions indexes
CREATE INDEX idx_prayer_interactions_prayer_id ON public.prayer_interactions(prayer_id);
CREATE INDEX idx_prayer_interactions_user_id ON public.prayer_interactions(user_id);

-- Community requests indexes
CREATE INDEX idx_community_requests_status ON public.community_requests(status);
CREATE INDEX idx_community_requests_category ON public.community_requests(category);
CREATE INDEX idx_community_requests_created_at ON public.community_requests(created_at DESC);

-- Donations indexes
CREATE INDEX idx_donations_community_request_id ON public.donations(community_request_id);
CREATE INDEX idx_donations_donor_user_id ON public.donations(donor_user_id);
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_donations_created_at ON public.donations(created_at DESC);

-- Testimonials indexes
CREATE INDEX idx_testimonials_status ON public.testimonials(status);
CREATE INDEX idx_testimonials_is_featured ON public.testimonials(is_featured);
CREATE INDEX idx_testimonials_created_at ON public.testimonials(created_at DESC);

-- =========================================
-- GRANT PERMISSIONS
-- =========================================

-- Products
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;

-- Prayers
GRANT SELECT, INSERT, UPDATE ON public.prayers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.prayer_interactions TO authenticated;

-- Community requests and donations
GRANT SELECT ON public.community_requests TO authenticated;
GRANT SELECT ON public.community_requests TO anon;
GRANT SELECT, INSERT ON public.donations TO authenticated;

-- Testimonials
GRANT SELECT ON public.testimonials TO authenticated;
GRANT SELECT ON public.testimonials TO anon;
GRANT INSERT ON public.testimonials TO authenticated;

-- Admin permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- =========================================
-- SEED DATA (INITIAL PRODUCTS)
-- =========================================

-- Insert initial products to replace hardcoded ones
INSERT INTO public.products (name, description, price, category, rating, in_stock, inventory_count, image_url) VALUES
('Blessed Bear T-Shirt', 'Comfortable 100% cotton t-shirt featuring our beloved Ositos Bendecidos bear design', 29.99, 'clothing', 4.8, TRUE, 50, '/golden-bear.png'),
('Faith & Hope Coffee Mug', 'Ceramic mug with "God''s blessing is the best value—it''s free" quote', 19.99, 'accessories', 4.9, TRUE, 30, '/golden-bear.png'),
('Daily Prayer Journal', 'Beautiful leather-bound journal for daily prayers and spiritual growth', 24.99, 'books', 4.7, TRUE, 25, '/golden-bear.png'),
('Blessed Bear Hoodie', 'Warm fleece hoodie with golden bear embroidery - perfect for cold days', 49.99, 'clothing', 4.9, TRUE, 20, '/golden-bear.png'),
('Faith Sticker Collection', 'Set of 12 waterproof vinyl stickers with inspirational messages', 12.99, 'accessories', 4.6, TRUE, 100, '/golden-bear.png'),
('Scripture Study Bible', 'Complete study Bible with commentary and daily devotional notes', 39.99, 'books', 4.8, TRUE, 15, '/golden-bear.png'),
('Community Care Package', 'Full care package to support a family in need - includes food, essentials, and prayer card', 75.00, 'care', 5.0, TRUE, 10, '/golden-bear.png'),
('Ositos Bendecidos Tote Bag', 'Eco-friendly canvas tote with blessed bear design - perfect for groceries or church', 18.99, 'accessories', 4.5, TRUE, 40, '/golden-bear.png');

-- =========================================
-- SUCCESS MESSAGE
-- =========================================
SELECT 'Complete Supabase database setup with all tables created successfully!' AS message;
