const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://rqqqkquovwvsegaluxwe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Check community requests
  const { data: requests, error: reqError } = await supabase
    .from('community_requests')
    .select('id, title, target_amount, raised_amount, donor_count, status')
    .order('created_at', { ascending: false })
    .limit(3);
  
  console.log('\n📋 Recent Community Requests:');
  if (reqError) {
    console.error('Error:', reqError);
  } else if (requests && requests.length > 0) {
    requests.forEach(r => {
      console.log(`- ${r.title}`);
      console.log(`  ID: ${r.id}`);
      console.log(`  Goal: $${r.target_amount} | Raised: $${r.raised_amount || 0}`);
      console.log(`  Donors: ${r.donor_count || 0} | Status: ${r.status}`);
    });
  } else {
    console.log('No requests found');
  }

  // Check donations
  const { data: donations, error: donError } = await supabase
    .from('donations')
    .select('id, amount, payment_status, payment_intent_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('\n💳 Recent Donations:');
  if (donError) {
    console.error('Error:', donError);
  } else if (donations && donations.length > 0) {
    donations.forEach(d => {
      console.log(`- $${d.amount} - ${d.payment_status} - ${new Date(d.created_at).toLocaleDateString()}`);
      console.log(`  Intent: ${d.payment_intent_id || 'N/A'}`);
    });
  } else {
    console.log('No donations found');
  }

  process.exit(0);
}

check().catch(console.error);
