const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('Checking existing tables in database...\n');

  try {
    // Check if orders table exists
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (ordersError && ordersError.code === '42P01') {
      console.log('❌ Table "orders" does not exist');
    } else if (ordersError) {
      console.log('⚠️ Error checking orders table:', ordersError.message);
    } else {
      console.log('✅ Table "orders" exists');
    }

    // Check if order_items table exists
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('id')
      .limit(1);

    if (itemsError && itemsError.code === '42P01') {
      console.log('❌ Table "order_items" does not exist');
    } else if (itemsError) {
      console.log('⚠️ Error checking order_items table:', itemsError.message);
    } else {
      console.log('✅ Table "order_items" exists');
    }

    // Check if general_donations table exists
    const { data: donationsData, error: donationsError } = await supabase
      .from('general_donations')
      .select('id')
      .limit(1);

    if (donationsError && donationsError.code === '42P01') {
      console.log('❌ Table "general_donations" does not exist');
    } else if (donationsError) {
      console.log('⚠️ Error checking general_donations table:', donationsError.message);
    } else {
      console.log('✅ Table "general_donations" exists');
    }

    // Check products table structure
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (!productsError && productsData) {
      console.log('\n✅ Table "products" exists with columns:', Object.keys(productsData[0] || {}));
    }

    // Check donations table structure (for community donations)
    const { data: communityData, error: communityError } = await supabase
      .from('donations')
      .select('*')
      .limit(1);

    if (!communityError && communityData) {
      console.log('✅ Table "donations" (community) exists with columns:', Object.keys(communityData[0] || {}));
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables();