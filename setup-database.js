import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials
const supabaseUrl = 'https://rqqqkquovwvsegaluxwe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcXFrcXVvdnd2c2VnYWx1eHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA5MzI4NSwiZXhwIjoyMDcxNjY5Mjg1fQ.T5U8fimUYQGsqCEgadbo6EKqNVaWwKSY81c81sroP3A';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Начинаем установку базы данных Supabase...\n');
  console.log('📦 Project: ositos-bendecidos-prod');
  console.log('🔗 URL:', supabaseUrl);
  console.log('');

  try {
    // Читаем SQL файл
    const sqlPath = path.join(__dirname, 'backend-api', 'supabase-production.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Извлекаем только INSERT команды для данных (таблицы уже должны быть созданы через Dashboard)
    const insertCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.includes('INSERT INTO') && !cmd.startsWith('--'));

    console.log(`📋 Найдено ${insertCommands.length} команд для загрузки данных\n`);

    // Сначала проверим существующие таблицы
    console.log('🔍 Проверяем существующие таблицы...\n');
    
    const tables = ['users', 'products', 'prayers', 'prayer_interactions', 'community_requests', 'donations', 'testimonials'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Таблица ${table}: не найдена (${error.message})`);
        } else {
          console.log(`✅ Таблица ${table}: существует (записей: ${count || 0})`);
        }
      } catch (err) {
        console.log(`❌ Таблица ${table}: ошибка проверки`);
      }
    }

    console.log('\n📝 Загружаем данные в таблицы...\n');

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
        image_url: '/golden-bear.png'
      },
      {
        name: 'Faith & Hope Coffee Mug',
        description: 'Ceramic mug with Gods blessing is the best value its free quote',
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
        image_url: '/golden-bear.png'
      },
      {
        name: 'Faith Sticker Collection',
        description: 'Set of 12 waterproof vinyl stickers with inspirational messages',
        price: 12.99,
        category: 'accessories',
        rating: 4.6,
        in_stock: true,
        inventory_count: 100,
        image_url: '/golden-bear.png'
      },
      {
        name: 'Scripture Study Bible',
        description: 'Complete study Bible with commentary and daily devotional notes',
        price: 39.99,
        category: 'books',
        rating: 4.8,
        in_stock: true,
        inventory_count: 15,
        image_url: '/golden-bear.png'
      },
      {
        name: 'Community Care Package',
        description: 'Full care package to support a family in need - includes food, essentials, and prayer card',
        price: 75.00,
        category: 'care',
        rating: 5.0,
        in_stock: true,
        inventory_count: 10,
        image_url: '/golden-bear.png'
      },
      {
        name: 'Ositos Bendecidos Tote Bag',
        description: 'Eco-friendly canvas tote with blessed bear design - perfect for groceries or church',
        price: 18.99,
        category: 'accessories',
        rating: 4.5,
        in_stock: true,
        inventory_count: 40,
        image_url: '/golden-bear.png'
      }
    ];

    console.log('📦 Загружаем товары...');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'name' });
    
    if (productsError) {
      console.log(`⚠️  Ошибка загрузки товаров: ${productsError.message}`);
    } else {
      console.log(`✅ Загружено ${products.length} товаров`);
    }

    // Загрузка testimonials
    const testimonials = [
      {
        name: 'Maria Santos',
        story: 'Thanks to the community support, I was able to start my bakery and now I can provide for my three children. The care package kept us going during the hardest times.',
        status: 'approved',
        is_verified: true,
        is_featured: true,
        location: 'Los Angeles, CA',
        tags: ['Success Story', 'Business', 'Family']
      },
      {
        name: 'David Rodriguez',
        story: 'After losing my job during the pandemic, this community helped me find hope again. The prayer support and practical help meant everything to my family.',
        status: 'approved',
        is_verified: true,
        is_featured: true,
        location: 'Houston, TX',
        tags: ['Recovery', 'Employment', 'Faith']
      },
      {
        name: 'Jennifer Kim',
        story: 'The educational support program helped my daughter get into college. We are forever grateful for this blessed community that believes in helping others succeed.',
        status: 'approved',
        is_verified: true,
        is_featured: false,
        location: 'Seattle, WA',
        tags: ['Education', 'Family', 'Gratitude']
      }
    ];

    console.log('💬 Загружаем отзывы...');
    const { data: testimonialsData, error: testimonialsError } = await supabase
      .from('testimonials')
      .upsert(testimonials, { onConflict: 'name' });
    
    if (testimonialsError) {
      console.log(`⚠️  Ошибка загрузки отзывов: ${testimonialsError.message}`);
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
        }
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
        }
      }
    ];

    console.log('🤝 Загружаем community requests...');
    const { data: requestsData, error: requestsError } = await supabase
      .from('community_requests')
      .upsert(communityRequests, { onConflict: 'title' });
    
    if (requestsError) {
      console.log(`⚠️  Ошибка загрузки requests: ${requestsError.message}`);
    } else {
      console.log(`✅ Загружено ${communityRequests.length} community requests`);
    }

    // Создаем admin пользователя
    console.log('\n👤 Создаем admin пользователя...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@ositos.com',
      password: 'OsitosAdmin2025!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User'
      }
    });

    if (authError) {
      console.log(`⚠️  Admin пользователь уже существует или ошибка: ${authError.message}`);
    } else {
      console.log('✅ Admin пользователь создан в Auth');
      
      // Добавляем в таблицу users с ролью admin
      if (authData.user) {
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: 'admin@ositos.com',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            is_verified: true
          }, { onConflict: 'email' });
        
        if (userError) {
          console.log(`⚠️  Ошибка добавления в users: ${userError.message}`);
        } else {
          console.log('✅ Admin добавлен в таблицу users с ролью admin');
        }
      }
    }

    // Финальная проверка
    console.log('\n' + '='.repeat(50));
    console.log('📊 ФИНАЛЬНАЯ ПРОВЕРКА:\n');

    const checks = [
      { table: 'products', expected: 8 },
      { table: 'testimonials', expected: 3 },
      { table: 'community_requests', expected: 3 }
    ];

    let allGood = true;
    for (const check of checks) {
      const { count } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true });
      
      const status = count >= check.expected ? '✅' : '⚠️';
      console.log(`${status} ${check.table}: ${count || 0}/${check.expected}`);
      if (count < check.expected) allGood = false;
    }

    // Проверяем admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('email, role')
      .eq('email', 'admin@ositos.com')
      .single();
    
    if (adminUser && adminUser.role === 'admin') {
      console.log('✅ Admin пользователь: admin@ositos.com');
    } else {
      console.log('⚠️  Admin пользователь не найден');
      allGood = false;
    }

    console.log('\n' + '='.repeat(50));
    if (allGood) {
      console.log('🎉 БАЗА ДАННЫХ ПОЛНОСТЬЮ НАСТРОЕНА!\n');
      console.log('📱 Доступ к Admin Panel:');
      console.log('   URL: http://localhost:3000/admin');
      console.log('   Email: admin@ositos.com');
      console.log('   Password: OsitosAdmin2025!');
    } else {
      console.log('⚠️  База данных настроена частично.');
      console.log('Некоторые таблицы могут требовать ручного создания через Supabase Dashboard.');
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    console.log('\n💡 Рекомендации:');
    console.log('1. Убедитесь, что таблицы созданы в Supabase Dashboard');
    console.log('2. Проверьте SQL Editor и выполните supabase-production.sql вручную');
    console.log('3. Убедитесь, что RLS политики настроены правильно');
  }
}

// Запускаем установку
setupDatabase();