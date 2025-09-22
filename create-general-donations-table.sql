-- Create general_donations table for main donation page
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

-- Create indexes for performance
CREATE INDEX idx_general_donations_status ON general_donations(status);
CREATE INDEX idx_general_donations_stripe_payment_intent ON general_donations(stripe_payment_intent_id);
CREATE INDEX idx_general_donations_created_at ON general_donations(created_at DESC);

-- Grant access permissions
GRANT ALL ON general_donations TO postgres, anon, authenticated, service_role;