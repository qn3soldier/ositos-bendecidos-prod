import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rqqqkquovwvsegaluxwe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcXFrcXVvdnd2c2VnYWx1eHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA5MzI4NSwiZXhwIjoyMDcxNjY5Mjg1fQ.T5U8fimUYQGsqCEgadbo6EKqNVaWwKSY81c81sroP3A';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Проверяем существующие таблицы в Supabase...\n');

  // Список таблиц, которые должны быть
  const expectedTables = [
    'users', 'products', 'prayers', 'prayer_interactions', 'prayer_comments',
    'community_requests', 'donations', 'testimonials', 'orders', 'order_items',
    'notifications', 'payment_intents', 'refunds'
  ];

  console.log('📋 ПРОВЕРКА ТАБЛИЦ:\n');

  for (const table of expectedTables) {
    try {
      // Проверяем существование и количество записей
      const { data, count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: НЕ СУЩЕСТВУЕТ`);
        continue;
      }

      console.log(`✅ ${table}: существует (записей: ${count || 0})`);

      // Получаем структуру таблицы
      const { data: sampleData } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        console.log(`   Колонки: ${columns.join(', ')}`);
      }

    } catch (err) {
      console.log(`❌ ${table}: ошибка проверки - ${err.message}`);
    }
  }

  // Проверяем конкретные колонки в важных таблицах
  console.log('\n📊 ДЕТАЛЬНАЯ ПРОВЕРКА ВАЖНЫХ ТАБЛИЦ:\n');

  // Проверка users
  console.log('👤 Таблица users:');
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userData && userData.length > 0) {
      const userColumns = Object.keys(userData[0]);
      console.log(`   Найдено колонок: ${userColumns.length}`);
      console.log(`   Колонки: ${userColumns.join(', ')}`);

      // Проверяем важные колонки
      const requiredColumns = ['id', 'email', 'password_hash', 'first_name', 'last_name', 'role', 'is_active'];
      const missingColumns = requiredColumns.filter(col => !userColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log(`   ⚠️  Отсутствуют колонки: ${missingColumns.join(', ')}`);
      }
    }
  } catch (err) {
    console.log(`   ❌ Ошибка: ${err.message}`);
  }

  // Проверка products
  console.log('\n📦 Таблица products:');
  try {
    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (productData && productData.length > 0) {
      const productColumns = Object.keys(productData[0]);
      console.log(`   Найдено колонок: ${productColumns.length}`);
      console.log(`   Колонки: ${productColumns.join(', ')}`);
    }
  } catch (err) {
    console.log(`   ❌ Ошибка: ${err.message}`);
  }

  // Проверка prayers
  console.log('\n🙏 Таблица prayers:');
  try {
    const { data: prayerData } = await supabase
      .from('prayers')
      .select('*')
      .limit(1);

    if (prayerData && prayerData.length > 0) {
      const prayerColumns = Object.keys(prayerData[0]);
      console.log(`   Найдено колонок: ${prayerColumns.length}`);
      console.log(`   Колонки: ${prayerColumns.join(', ')}`);
    }
  } catch (err) {
    console.log(`   ❌ Ошибка: ${err.message}`);
  }

  console.log('\n✅ Проверка завершена!');
}

checkDatabase();