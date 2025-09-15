import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCommunityRequests() {
  try {
    console.log('🔍 Проверяем community requests...\n');

    // Получаем все requests
    const { data: requests, error } = await supabase
      .from('community_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка при получении requests:', error);
      return;
    }

    console.log(`Найдено requests: ${requests.length}\n`);

    if (requests.length > 0) {
      console.log('Последние 5 requests:');
      requests.slice(0, 5).forEach((req, index) => {
        console.log(`\n${index + 1}. ${req.title}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Category: ${req.category}`);
        console.log(`   Created: ${new Date(req.created_at).toLocaleString()}`);
        console.log(`   Target: $${req.target_amount}`);
        console.log(`   Raised: $${req.raised_amount}`);
      });
    }

    // Проверим активные запросы
    const activeRequests = requests.filter(r => r.status === 'active');
    console.log(`\n✅ Активных запросов: ${activeRequests.length}`);

  } catch (error) {
    console.error('Ошибка:', error);
  }
}

checkCommunityRequests();