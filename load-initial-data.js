import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://rqqqkquovwvsegaluxwe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcXFrcXVvdnd2c2VnYWx1eHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA5MzI4NSwiZXhwIjoyMDcxNjY5Mjg1fQ.T5U8fimUYQGsqCEgadbo6EKqNVaWwKSY81c81sroP3A';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function loadInitialData() {
  console.log('🚀 Загружаем начальные данные в базу...\n');

  try {
    // Проверяем таблицы
    console.log('🔍 Проверяем таблицы...\n');

    const tables = ['users', 'products', 'prayers', 'community_requests', 'testimonials'];

    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      console.log(`📊 ${table}: ${count || 0} записей`);
    }

    console.log('\n📝 Загружаем данные...\n');

    // Загрузка products
    const products = [
      {
        name: 'Blessed Bear T-Shirt',
        description: 'Comfortable 100% cotton t-shirt featuring our beloved Ositos Bendecidos bear design',
        price: 29.99,
        category: 'clothing',
        rating: 4.8,
        in_stock: true,
        inventory_count: 50,
        image_url: '/golden-bear.png',
        featured: true
      },
      {
        name: 'Faith & Hope Coffee Mug',
        description: 'Ceramic mug with "God\'s blessing is the best value, it\'s free" quote',
        price: 19.99,
        category: 'accessories',
        rating: 4.9,
        in_stock: true,
        inventory_count: 30,
        image_url: '/golden-bear.png'
      },
      {
        name: 'Daily Prayer Journal',
        description: 'Beautiful leather-bound journal for daily prayers and spiritual growth',
        price: 24.99,
        category: 'books',
        rating: 4.7,
        in_stock: true,
        inventory_count: 25,
        image_url: '/golden-bear.png'
      },
      {
        name: 'Blessed Bear Hoodie',
        description: 'Warm fleece hoodie with golden bear embroidery - perfect for cold days',
        price: 49.99,
        category: 'clothing',
        rating: 4.9,
        in_stock: true,
        inventory_count: 20,
        image_url: '/golden-bear.png',
        featured: true
      },
      {
        name: 'Community Care Package',
        description: 'Full care package to support a family in need - includes food, essentials, and prayer card',
        price: 75.00,
        category: 'care',
        rating: 5.0,
        in_stock: true,
        inventory_count: 10,
        image_url: '/golden-bear.png',
        featured: true
      }
    ];

    console.log('📦 Загружаем товары...');
    const { error: productsError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'name' });

    if (productsError) {
      console.log(`⚠️  Ошибка: ${productsError.message}`);
    } else {
      console.log(`✅ Загружено ${products.length} товаров`);
    }

    // Загрузка testimonials
    const testimonials = [
      {
        name: 'Maria Santos',
        email: 'maria.santos@example.com',
        story: 'Thanks to the community support, I was able to start my bakery and now I can provide for my three children.',
        status: 'approved',
        is_verified: true,
        is_featured: true,
        location: 'Los Angeles, CA',
        impact_category: 'business'
      },
      {
        name: 'David Rodriguez',
        email: 'david.r@example.com',
        story: 'After losing my job during the pandemic, this community helped me find hope again.',
        status: 'approved',
        is_verified: true,
        is_featured: true,
        location: 'Houston, TX',
        impact_category: 'employment'
      },
      {
        name: 'Jennifer Kim',
        email: 'jkim@example.com',
        story: 'The educational support program helped my daughter get into college.',
        status: 'approved',
        is_verified: true,
        location: 'Seattle, WA',
        impact_category: 'education'
      }
    ];

    console.log('💬 Загружаем отзывы...');
    const { error: testimonialsError } = await supabase
      .from('testimonials')
      .upsert(testimonials, { onConflict: 'email' });

    if (testimonialsError) {
      console.log(`⚠️  Ошибка: ${testimonialsError.message}`);
    } else {
      console.log(`✅ Загружено ${testimonials.length} отзывов`);
    }

    // Загрузка community requests
    const communityRequests = [
      {
        title: 'Small Bakery Equipment for Single Mom',
        description: 'Maria needs commercial-grade baking equipment to expand her home bakery business.',
        target_amount: 5000.00,
        raised_amount: 2750.00,
        category: 'business',
        status: 'active',
        beneficiary_info: {
          name: 'Maria Santos',
          family_size: 4,
          location: 'Los Angeles, CA'
        }
      },
      {
        title: 'Medical Bills for Senior Citizen',
        description: 'Roberto, 73, needs help with mounting medical bills after his recent surgery.',
        target_amount: 8000.00,
        raised_amount: 3200.00,
        category: 'medical',
        status: 'active',
        beneficiary_info: {
          name: 'Roberto Martinez',
          age: 73,
          location: 'Phoenix, AZ'
        }
      },
      {
        title: 'College Fund for Promising Student',
        description: 'Ana is a first-generation college student who excels academically.',
        target_amount: 12000.00,
        raised_amount: 8400.00,
        category: 'education',
        status: 'active',
        beneficiary_info: {
          name: 'Ana Gutierrez',
          age: 18,
          location: 'San Antonio, TX'
        }
      }
    ];

    console.log('🤝 Загружаем community requests...');
    const { error: requestsError } = await supabase
      .from('community_requests')
      .upsert(communityRequests, { onConflict: 'title' });

    if (requestsError) {
      console.log(`⚠️  Ошибка: ${requestsError.message}`);
    } else {
      console.log(`✅ Загружено ${communityRequests.length} community requests`);
    }

    // Финальная проверка
    console.log('\n' + '='.repeat(50));
    console.log('📊 ФИНАЛЬНАЯ ПРОВЕРКА:\n');

    const finalChecks = [
      { table: 'products', expected: 5 },
      { table: 'testimonials', expected: 3 },
      { table: 'community_requests', expected: 3 }
    ];

    for (const check of finalChecks) {
      const { count } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true });

      const status = count >= check.expected ? '✅' : '⚠️';
      console.log(`${status} ${check.table}: ${count || 0}/${check.expected}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ЗАГРУЗКА ДАННЫХ ЗАВЕРШЕНА!\n');
    console.log('📌 Не забудьте выполнить update-admin-password.sql в Supabase SQL Editor');
    console.log('📌 Пароль админа: OsitosAdmin2025!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Запускаем загрузку
loadInitialData();