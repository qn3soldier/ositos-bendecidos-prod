import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rqqqkquovwvsegaluxwe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcXFrcXVvdnd2c2VnYWx1eHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA5MzI4NSwiZXhwIjoyMDcxNjY5Mjg1fQ.T5U8fimUYQGsqCEgadbo6EKqNVaWwKSY81c81sroP3A';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function loadData() {
  console.log('📝 Загружаем testimonials и community requests...\n');

  // Загрузка testimonials
  const testimonials = [
    {
      name: 'Maria Santos',
      email: 'maria.santos@example.com',
      story: 'Thanks to the community support, I was able to start my bakery and now I can provide for my three children. The care package kept us going during the hardest times.',
      status: 'approved',
      is_verified: true,
      is_featured: true,
      location: 'Los Angeles, CA',
      impact_category: 'business',
      tags: ['Success Story', 'Business', 'Family']
    },
    {
      name: 'David Rodriguez',
      email: 'david.r@example.com',
      story: 'After losing my job during the pandemic, this community helped me find hope again. The prayer support and practical help meant everything to my family.',
      status: 'approved',
      is_verified: true,
      is_featured: true,
      location: 'Houston, TX',
      impact_category: 'employment',
      tags: ['Recovery', 'Employment', 'Faith']
    },
    {
      name: 'Jennifer Kim',
      email: 'jkim@example.com',
      story: 'The educational support program helped my daughter get into college. We are forever grateful for this blessed community that believes in helping others succeed.',
      status: 'approved',
      is_verified: true,
      location: 'Seattle, WA',
      impact_category: 'education',
      tags: ['Education', 'Family', 'Gratitude']
    }
  ];

  console.log('💬 Загружаем отзывы...');
  const { data: testimonialsData, error: testimonialsError } = await supabase
    .from('testimonials')
    .insert(testimonials);

  if (testimonialsError) {
    console.log(`⚠️  Ошибка: ${testimonialsError.message}`);
  } else {
    console.log(`✅ Загружено ${testimonials.length} отзывов`);
  }

  // Загрузка community requests
  const communityRequests = [
    {
      title: 'Small Bakery Equipment for Single Mom',
      description: 'Maria needs commercial-grade baking equipment to expand her home bakery business and provide for her three children. She has the skills and determination, just needs the tools.',
      target_amount: 5000.00,
      raised_amount: 2750.00,
      category: 'business',
      status: 'active',
      beneficiary_info: {
        name: 'Maria Santos',
        family_size: 4,
        location: 'Los Angeles, CA',
        story: 'Single mother working to build sustainable income'
      },
      is_featured: true
    },
    {
      title: 'Medical Bills for Senior Citizen',
      description: 'Roberto, 73, needs help with mounting medical bills after his recent surgery. He has no family support and limited income from social security.',
      target_amount: 8000.00,
      raised_amount: 3200.00,
      category: 'medical',
      status: 'active',
      beneficiary_info: {
        name: 'Roberto Martinez',
        age: 73,
        location: 'Phoenix, AZ',
        medical_condition: 'Heart surgery recovery',
        insurance_status: 'Medicare only'
      }
    },
    {
      title: 'College Fund for Promising Student',
      description: 'Ana is a first-generation college student who excels academically but lacks financial resources. Help her achieve her dream of becoming a nurse to serve her community.',
      target_amount: 12000.00,
      raised_amount: 8400.00,
      category: 'education',
      status: 'active',
      beneficiary_info: {
        name: 'Ana Gutierrez',
        age: 18,
        location: 'San Antonio, TX',
        gpa: 3.9,
        major: 'Nursing',
        career_goal: 'Community health nurse'
      },
      is_featured: true
    }
  ];

  console.log('🤝 Загружаем community requests...');
  const { data: requestsData, error: requestsError } = await supabase
    .from('community_requests')
    .insert(communityRequests);

  if (requestsError) {
    console.log(`⚠️  Ошибка: ${requestsError.message}`);
  } else {
    console.log(`✅ Загружено ${communityRequests.length} community requests`);
  }

  // Финальная проверка
  console.log('\n' + '='.repeat(50));
  console.log('📊 ФИНАЛЬНАЯ ПРОВЕРКА:\n');

  const tables = ['products', 'testimonials', 'community_requests', 'users'];
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`📊 ${table}: ${count || 0} записей`);
  }

  console.log('\n✅ Готово!');
}

loadData();