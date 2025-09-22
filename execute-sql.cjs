const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
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
    purpose VARCHAR(100) DEFAULT 'general_fund',

    status VARCHAR(50) DEFAULT 'pending',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_general_donations_status ON general_donations(status);
CREATE INDEX IF NOT EXISTS idx_general_donations_stripe_payment_intent ON general_donations(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_general_donations_created_at ON general_donations(created_at DESC);
`;

async function executeSql() {
  console.log('Creating general_donations table...\n');

  try {
    // Execute SQL using rpc
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // If rpc doesn't exist, we'll need to create table through REST API
      console.log('Direct SQL execution not available, trying alternative method...');

      // Test if table was created by checking it
      const { data: testData, error: testError } = await supabase
        .from('general_donations')
        .select('id')
        .limit(1);

      if (testError && testError.code === '42P01') {
        console.log('❌ Table creation failed. Please create manually in Supabase dashboard.');
        console.log('\nSQL to execute:\n', sql);
      } else {
        console.log('✅ Table general_donations exists or was created successfully!');
      }
    } else {
      console.log('✅ SQL executed successfully!');
    }

    // Verify table exists
    const { data: checkData, error: checkError } = await supabase
      .from('general_donations')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ Verified: general_donations table is accessible');
    } else {
      console.log('⚠️ Warning:', checkError.message);
    }

  } catch (error) {
    console.error('Error:', error);
    console.log('\n📋 Please execute this SQL manually in Supabase SQL Editor:\n');
    console.log(sql);
  }
}

executeSql();