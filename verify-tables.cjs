const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTables() {
  console.log('Verifying database tables...\n');

  // Test orders table
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (!error) {
      console.log('✅ orders table - OK');
      console.log('   Columns:', Object.keys(data[0] || {}).length > 0 ? Object.keys(data[0]) : 'Empty table');
    } else {
      console.log('❌ orders table - Error:', error.message);
    }
  } catch (e) {
    console.log('❌ orders table - Error:', e.message);
  }

  // Test order_items table
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .limit(1);

    if (!error) {
      console.log('✅ order_items table - OK');
      console.log('   Columns:', Object.keys(data[0] || {}).length > 0 ? Object.keys(data[0]) : 'Empty table');
    } else {
      console.log('❌ order_items table - Error:', error.message);
    }
  } catch (e) {
    console.log('❌ order_items table - Error:', e.message);
  }

  // Test general_donations table
  console.log('\nTrying different approaches for general_donations...');

  // Try 1: Direct select
  try {
    const { data, error } = await supabase
      .from('general_donations')
      .select('*')
      .limit(1);

    if (!error) {
      console.log('✅ general_donations table - OK (direct select)');
      console.log('   Columns:', Object.keys(data[0] || {}).length > 0 ? Object.keys(data[0]) : 'Empty table');
    } else {
      console.log('⚠️ Direct select failed:', error.message);
    }
  } catch (e) {
    console.log('⚠️ Direct select error:', e.message);
  }

  // Try 2: Insert test record
  try {
    const testRecord = {
      amount: 1.00,
      donor_name: 'Test',
      donor_email: 'test@test.com',
      status: 'test',
      purpose: 'test'
    };

    const { data, error } = await supabase
      .from('general_donations')
      .insert([testRecord])
      .select();

    if (!error) {
      console.log('✅ general_donations table - OK (insert test worked)');
      console.log('   Test record created with ID:', data[0].id);

      // Clean up test record
      await supabase
        .from('general_donations')
        .delete()
        .eq('id', data[0].id);
      console.log('   Test record deleted');
    } else {
      console.log('⚠️ Insert test failed:', error.message);
    }
  } catch (e) {
    console.log('⚠️ Insert test error:', e.message);
  }
}

verifyTables();