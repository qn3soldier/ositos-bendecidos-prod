-- FULL PRODUCTION SUPABASE SCHEMA WITH ALL BUSINESS LOGIC

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Admins can view all users') THEN
    CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Service role can do everything') THEN
    CREATE POLICY "Service role can do everything" ON public.users FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create user profile function
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_users_updated ON public.users;
CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
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

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Anyone can view products') THEN
    CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Service role can manage products') THEN
    CREATE POLICY "Service role can manage products" ON public.products FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DROP TRIGGER IF EXISTS on_products_updated ON public.products;
CREATE TRIGGER on_products_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Prayers table
CREATE TABLE IF NOT EXISTS public.prayers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  prayer_count INTEGER DEFAULT 0 CHECK (prayer_count >= 0),
  comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'reported')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prayers' AND policyname = 'Anyone can view active prayers') THEN
    CREATE POLICY "Anyone can view active prayers" ON public.prayers FOR SELECT USING (status = 'active');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prayers' AND policyname = 'Users can create prayers') THEN
    CREATE POLICY "Users can create prayers" ON public.prayers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prayers' AND policyname = 'Users can update own prayers') THEN
    CREATE POLICY "Users can update own prayers" ON public.prayers FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DROP TRIGGER IF EXISTS on_prayers_updated ON public.prayers;
CREATE TRIGGER on_prayers_updated
  BEFORE UPDATE ON public.prayers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Prayer interactions table
CREATE TABLE IF NOT EXISTS public.prayer_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_id UUID REFERENCES public.prayers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('pray', 'comment')),
  comment_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prayer_id, user_id, interaction_type)
);

ALTER TABLE public.prayer_interactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prayer_interactions' AND policyname = 'Anyone can view prayer interactions') THEN
    CREATE POLICY "Anyone can view prayer interactions" ON public.prayer_interactions FOR SELECT USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prayer_interactions' AND policyname = 'Authenticated users can create interactions') THEN
    CREATE POLICY "Authenticated users can create interactions" ON public.prayer_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Community requests table
CREATE TABLE IF NOT EXISTS public.community_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_amount DECIMAL(10,2) DEFAULT 0 CHECK (target_amount >= 0),
  raised_amount DECIMAL(10,2) DEFAULT 0 CHECK (raised_amount >= 0),
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  beneficiary_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deadline TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.community_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_requests' AND policyname = 'Anyone can view active community requests') THEN
    CREATE POLICY "Anyone can view active community requests" ON public.community_requests FOR SELECT USING (status = 'active');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_requests' AND policyname = 'Users can create community requests') THEN
    CREATE POLICY "Users can create community requests" ON public.community_requests FOR INSERT WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;

DROP TRIGGER IF EXISTS on_community_requests_updated ON public.community_requests;
CREATE TRIGGER on_community_requests_updated
  BEFORE UPDATE ON public.community_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Donations table
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_request_id UUID REFERENCES public.community_requests(id),
  donor_user_id UUID REFERENCES auth.users(id),
  donor_name TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  is_anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  payment_method TEXT,
  payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'donations' AND policyname = 'Donors can view own donations') THEN
    CREATE POLICY "Donors can view own donations" ON public.donations FOR SELECT USING (donor_user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'donations' AND policyname = 'Authenticated users can create donations') THEN
    CREATE POLICY "Authenticated users can create donations" ON public.donations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
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

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'testimonials' AND policyname = 'Anyone can view approved testimonials') THEN
    CREATE POLICY "Anyone can view approved testimonials" ON public.testimonials FOR SELECT USING (status = 'approved');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'testimonials' AND policyname = 'Users can create testimonials') THEN
    CREATE POLICY "Users can create testimonials" ON public.testimonials FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS on_testimonials_updated ON public.testimonials;
CREATE TRIGGER on_testimonials_updated
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Prayer count update function
CREATE OR REPLACE FUNCTION update_prayer_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.interaction_type = 'pray' THEN
      UPDATE public.prayers SET prayer_count = prayer_count + 1 WHERE id = NEW.prayer_id;
    ELSIF NEW.interaction_type = 'comment' THEN
      UPDATE public.prayers SET comment_count = comment_count + 1 WHERE id = NEW.prayer_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.interaction_type = 'pray' THEN
      UPDATE public.prayers SET prayer_count = prayer_count - 1 WHERE id = OLD.prayer_id;
    ELSIF OLD.interaction_type = 'comment' THEN
      UPDATE public.prayers SET comment_count = comment_count - 1 WHERE id = OLD.prayer_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_prayer_interaction_change ON public.prayer_interactions;
CREATE TRIGGER on_prayer_interaction_change
  AFTER INSERT OR DELETE ON public.prayer_interactions
  FOR EACH ROW EXECUTE FUNCTION update_prayer_counts();

-- Community request amount update function
CREATE OR REPLACE FUNCTION update_community_request_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    UPDATE public.community_requests SET raised_amount = raised_amount + NEW.amount, updated_at = NOW() WHERE id = NEW.community_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    UPDATE public.community_requests SET raised_amount = raised_amount + NEW.amount, updated_at = NOW() WHERE id = NEW.community_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' THEN
    UPDATE public.community_requests SET raised_amount = raised_amount - OLD.amount, updated_at = NOW() WHERE id = OLD.community_request_id;
    RETURN NEW;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_donation_status_change ON public.donations;
CREATE TRIGGER on_donation_status_change
  AFTER INSERT OR UPDATE OR DELETE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION update_community_request_amount();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_prayers_status ON public.prayers(status);
CREATE INDEX IF NOT EXISTS idx_prayers_created_at ON public.prayers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_tags ON public.prayers USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_prayer_interactions_prayer_id ON public.prayer_interactions(prayer_id);
CREATE INDEX IF NOT EXISTS idx_community_requests_status ON public.community_requests(status);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON public.testimonials(status);

-- User profiles view
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT id, email, first_name, last_name, is_verified, avatar_url, role, created_at, updated_at, last_login_at
FROM public.users;

-- Permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE ON public.prayers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.prayer_interactions TO authenticated;
GRANT SELECT ON public.community_requests TO authenticated;
GRANT SELECT ON public.community_requests TO anon;
GRANT SELECT, INSERT ON public.donations TO authenticated;
GRANT SELECT ON public.testimonials TO authenticated;
GRANT SELECT ON public.testimonials TO anon;
GRANT INSERT ON public.testimonials TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Seed data
INSERT INTO public.products (name, description, price, category, rating, in_stock, inventory_count, image_url) 
SELECT 'Blessed Bear T-Shirt', 'Comfortable 100% cotton t-shirt featuring our beloved Ositos Bendecidos bear design', 29.99, 'clothing', 4.8, TRUE, 50, '/golden-bear.png'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Blessed Bear T-Shirt');

INSERT INTO public.products (name, description, price, category, rating, in_stock, inventory_count, image_url) 
SELECT 'Faith & Hope Coffee Mug', 'Ceramic mug with Gods blessing is the best value its free quote', 19.99, 'accessories', 4.9, TRUE, 30, '/golden-bear.png'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Faith & Hope Coffee Mug');

INSERT INTO public.products (name, description, price, category, rating, in_stock, inventory_count, image_url) 
SELECT 'Daily Prayer Journal', 'Beautiful leather-bound journal for daily prayers and spiritual growth', 24.99, 'books', 4.7, TRUE, 25, '/golden-bear.png'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Daily Prayer Journal');

INSERT INTO public.products (name, description, price, category, rating, in_stock, inventory_count, image_url) 
SELECT 'Blessed Bear Hoodie', 'Warm fleece hoodie with golden bear embroidery - perfect for cold days', 49.99, 'clothing', 4.9, TRUE, 20, '/golden-bear.png'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Blessed Bear Hoodie');

INSERT INTO public.products (name, description, price, category, rating, in_stock, inventory_count, image_url) 
SELECT 'Faith Sticker Collection', 'Set of 12 waterproof vinyl stickers with inspirational messages', 12.99, 'accessories', 4.6, TRUE, 100, '/golden-bear.png'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Faith Sticker Collection');

INSERT INTO public.products (name, description, price, category, rating, in_stock, inventory_count, image_url) 
SELECT 'Scripture Study Bible', 'Complete study Bible with commentary and daily devotional notes', 39.99, 'books', 4.8, TRUE, 15, '/golden-bear.png'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Scripture Study Bible');

INSERT INTO public.products (name, description, price, category, rating, in_stock, inventory_count, image_url) 
SELECT 'Community Care Package', 'Full care package to support a family in need - includes food, essentials, and prayer card', 75.00, 'care', 5.0, TRUE, 10, '/golden-bear.png'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Community Care Package');

INSERT INTO public.products (name, description, price, category, rating, in_stock, inventory_count, image_url) 
SELECT 'Ositos Bendecidos Tote Bag', 'Eco-friendly canvas tote with blessed bear design - perfect for groceries or church', 18.99, 'accessories', 4.5, TRUE, 40, '/golden-bear.png'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Ositos Bendecidos Tote Bag');

-- Seed testimonials
INSERT INTO public.testimonials (name, story, status, is_verified, is_featured, location, tags) 
SELECT 'Maria Santos', 'Thanks to the community support, I was able to start my bakery and now I can provide for my three children. The care package kept us going during the hardest times.', 'approved', TRUE, TRUE, 'Los Angeles, CA', ARRAY['Success Story', 'Business', 'Family']
WHERE NOT EXISTS (SELECT 1 FROM public.testimonials WHERE name = 'Maria Santos');

INSERT INTO public.testimonials (name, story, status, is_verified, is_featured, location, tags) 
SELECT 'David Rodriguez', 'After losing my job during the pandemic, this community helped me find hope again. The prayer support and practical help meant everything to my family.', 'approved', TRUE, TRUE, 'Houston, TX', ARRAY['Recovery', 'Employment', 'Faith']
WHERE NOT EXISTS (SELECT 1 FROM public.testimonials WHERE name = 'David Rodriguez');

INSERT INTO public.testimonials (name, story, status, is_verified, is_featured, location, tags) 
SELECT 'Jennifer Kim', 'The educational support program helped my daughter get into college. We are forever grateful for this blessed community that believes in helping others succeed.', 'approved', TRUE, FALSE, 'Seattle, WA', ARRAY['Education', 'Family', 'Gratitude']
WHERE NOT EXISTS (SELECT 1 FROM public.testimonials WHERE name = 'Jennifer Kim');

-- Seed community requests
INSERT INTO public.community_requests (title, description, target_amount, raised_amount, category, status, beneficiary_info) 
SELECT 'Small Bakery Equipment for Single Mom', 'Maria needs commercial-grade baking equipment to expand her home bakery business and provide for her three children. She has the skills and determination, just needs the tools.', 5000.00, 2750.00, 'business', 'active', 
'{"name": "Maria Santos", "family_size": 4, "location": "Los Angeles, CA", "story": "Single mother working to build sustainable income"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.community_requests WHERE title = 'Small Bakery Equipment for Single Mom');

INSERT INTO public.community_requests (title, description, target_amount, raised_amount, category, status, beneficiary_info) 
SELECT 'Medical Bills for Senior Citizen', 'Roberto, 73, needs help with mounting medical bills after his recent surgery. He has no family support and limited income from social security.', 8000.00, 3200.00, 'medical', 'active',
'{"name": "Roberto Martinez", "age": 73, "location": "Phoenix, AZ", "medical_condition": "Heart surgery recovery", "insurance_status": "Medicare only"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.community_requests WHERE title = 'Medical Bills for Senior Citizen');

INSERT INTO public.community_requests (title, description, target_amount, raised_amount, category, status, beneficiary_info) 
SELECT 'College Fund for Promising Student', 'Ana is a first-generation college student who excels academically but lacks financial resources. Help her achieve her dream of becoming a nurse to serve her community.', 12000.00, 8400.00, 'education', 'active',
'{"name": "Ana Gutierrez", "age": 18, "location": "San Antonio, TX", "gpa": 3.9, "major": "Nursing", "career_goal": "Community health nurse"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.community_requests WHERE title = 'College Fund for Promising Student');

SELECT 'Full production Supabase database setup completed successfully!' AS message;
