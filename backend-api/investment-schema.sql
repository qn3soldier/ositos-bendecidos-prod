-- INVESTMENT PLATFORM SCHEMA
-- Enterprise-level investment opportunities management

-- Investment Opportunities (Projects to be funded)
CREATE TABLE IF NOT EXISTS public.investment_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  category TEXT NOT NULL CHECK (category IN ('community', 'business', 'education', 'healthcare', 'technology')),
  
  -- Financial Details
  target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
  minimum_investment DECIMAL(12,2) DEFAULT 100 CHECK (minimum_investment > 0),
  current_funded DECIMAL(12,2) DEFAULT 0 CHECK (current_funded >= 0),
  
  -- Business Details
  location TEXT,
  expected_jobs INTEGER DEFAULT 0,
  expected_roi_percentage DECIMAL(5,2), -- Expected Return on Investment %
  timeline_months INTEGER, -- Project timeline in months
  
  -- Impact Metrics
  beneficiaries_count INTEGER DEFAULT 0, -- People who will benefit
  community_impact TEXT,
  
  -- Project Status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'funded', 'in_progress', 'completed', 'cancelled')),
  
  -- Media
  images JSONB DEFAULT '[]', -- Array of image URLs
  documents JSONB DEFAULT '[]', -- Array of document URLs (business plans, etc.)
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  funding_deadline TIMESTAMP WITH TIME ZONE,
  project_start_date TIMESTAMP WITH TIME ZONE,
  project_end_date TIMESTAMP WITH TIME ZONE
);

-- Individual Investments (User investments in opportunities)
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.investment_opportunities(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES auth.users(id),
  
  -- Investment Details
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  investment_type TEXT DEFAULT 'donation' CHECK (investment_type IN ('donation', 'loan', 'equity')),
  
  -- For Loans
  expected_return_percentage DECIMAL(5,2), -- For loan type investments
  return_period_months INTEGER, -- How long until return expected
  
  -- Payment Information
  payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'stripe', 'bank_transfer', 'crypto')),
  payment_id TEXT, -- Transaction ID from payment processor
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Investor Information (for anonymous donations)
  investor_name TEXT, -- If not logged in user
  investor_email TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  
  -- Investment Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'refunded', 'cancelled')),
  
  -- Returns Tracking (for loans/equity)
  expected_return_amount DECIMAL(12,2) DEFAULT 0,
  returned_amount DECIMAL(12,2) DEFAULT 0,
  next_return_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Investment Updates (Progress updates from project owners)
CREATE TABLE IF NOT EXISTS public.investment_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.investment_opportunities(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT DEFAULT 'progress' CHECK (update_type IN ('progress', 'milestone', 'financial', 'completion', 'issue')),
  
  -- Media
  images JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  
  -- Financial Update (if applicable)
  funds_used DECIMAL(12,2),
  remaining_funds DECIMAL(12,2),
  
  -- Milestone Progress
  completion_percentage INTEGER CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT TRUE
);

-- Investment Returns (Track returns paid to investors for loans)
CREATE TABLE IF NOT EXISTS public.investment_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.investment_opportunities(id),
  
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  return_type TEXT DEFAULT 'interest' CHECK (return_type IN ('principal', 'interest', 'profit_share')),
  
  payment_method TEXT,
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  
  due_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Investment Categories (Predefined categories for opportunities)
CREATE TABLE IF NOT EXISTS public.investment_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Icon class or emoji
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investment Inquiries (Keep existing inquiry system for potential investors)
CREATE TABLE IF NOT EXISTS public.investment_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  investment_range TEXT CHECK (investment_range IN ('1000-5000', '5000-10000', '10000-25000', '25000+')),
  interest_areas TEXT[], -- Array of categories they're interested in
  
  message TEXT NOT NULL,
  receive_updates BOOLEAN DEFAULT FALSE,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'qualified', 'closed')),
  assigned_to UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- RLS Policies
ALTER TABLE public.investment_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_inquiries ENABLE ROW LEVEL SECURITY;

-- Public read access for opportunities
CREATE POLICY "Investment opportunities are viewable by everyone" ON public.investment_opportunities
  FOR SELECT USING (status = 'active');

-- Users can view their own investments
CREATE POLICY "Users can view own investments" ON public.investments
  FOR SELECT USING (auth.uid() = investor_id);

-- Public read access for updates
CREATE POLICY "Investment updates are viewable by everyone" ON public.investment_updates
  FOR SELECT USING (is_public = true);

-- Indexes for performance
CREATE INDEX idx_investment_opportunities_category ON public.investment_opportunities(category);
CREATE INDEX idx_investment_opportunities_status ON public.investment_opportunities(status);
CREATE INDEX idx_investment_opportunities_created_at ON public.investment_opportunities(created_at DESC);
CREATE INDEX idx_investments_opportunity_id ON public.investments(opportunity_id);
CREATE INDEX idx_investments_investor_id ON public.investments(investor_id);
CREATE INDEX idx_investment_updates_opportunity_id ON public.investment_updates(opportunity_id);

-- Insert default categories
INSERT INTO public.investment_categories (name, description, icon) VALUES
('Community', 'Community development and support projects', '🏘️'),
('Business', 'Small business development and entrepreneurship', '💼'),
('Education', 'Educational programs and skill development', '📚'),
('Healthcare', 'Healthcare access and wellness programs', '🏥'),
('Technology', 'Technology solutions for community benefit', '💻')
ON CONFLICT (name) DO NOTHING;

-- Insert sample investment opportunities for demo
INSERT INTO public.investment_opportunities (
  title, 
  description, 
  long_description,
  category, 
  target_amount, 
  minimum_investment,
  current_funded,
  location, 
  expected_jobs, 
  expected_roi_percentage,
  timeline_months,
  beneficiaries_count,
  community_impact,
  status,
  funding_deadline,
  images
) VALUES 
(
  'Community Support Center',
  'Local community center providing resources, guidance, and support for families in need.',
  'Our Community Support Center will serve as a hub for families facing economic hardship. The center will provide job placement services, financial counseling, childcare assistance, and emergency food distribution. With experienced social workers and community volunteers, we aim to help 500+ families annually achieve economic stability and self-sufficiency.',
  'community',
  15000.00,
  100.00,
  7500.00,
  'Phoenix, AZ',
  12,
  8.5,
  6,
  500,
  'Will serve 500+ families annually with job placement, financial counseling, and emergency assistance',
  'active',
  NOW() + INTERVAL '60 days',
  '["https://example.com/community-center.jpg"]'
),
(
  'Youth Mentorship Program',
  'Educational and mentorship program helping young adults develop valuable life skills.',
  'Our Youth Mentorship Program pairs at-risk teenagers (ages 14-18) with successful community mentors. The program includes weekly one-on-one mentoring, group workshops on financial literacy, job interview skills, and college preparation. We provide scholarships for technical training and help participants secure their first jobs. Over 3 years, we aim to mentor 200+ youth and achieve an 85% high school graduation rate among participants.',
  'education',
  8000.00,
  50.00,
  3200.00,
  'Austin, TX',
  8,
  12.0,
  18,
  200,
  '200+ at-risk youth will receive mentoring and skills training over 3 years',
  'active',
  NOW() + INTERVAL '45 days',
  '["https://example.com/youth-program.jpg"]'
),
(
  'Small Business Incubator',
  'Supporting entrepreneurship and small business development in underserved communities.',
  'The Small Business Incubator provides comprehensive support for aspiring entrepreneurs from underserved communities. Services include business plan development, legal assistance, accounting support, marketing guidance, and access to micro-loans. The program includes a co-working space, business workshops, and networking events. We project supporting 50 new businesses in Year 1, creating 150+ jobs and generating $2M+ in local economic activity.',
  'business',
  25000.00,
  250.00,
  12500.00,
  'Denver, CO',
  25,
  15.0,
  12,
  150,
  '50 new businesses supported, 150+ jobs created, $2M+ local economic impact',
  'active',
  NOW() + INTERVAL '30 days',
  '["https://example.com/incubator.jpg"]'
);