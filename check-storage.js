import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorage() {
  try {
    console.log('Проверяем Supabase Storage...\n');

    // Проверяем список buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Ошибка при получении списка buckets:', error);
      return;
    }

    console.log('Существующие buckets:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (${bucket.public ? 'публичный' : 'приватный'})`);
    });

    // Проверяем наш bucket
    const productsBucket = buckets.find(b => b.name === 'products');

    if (productsBucket) {
      console.log('\n✅ Bucket "products" существует!');
      console.log('   Публичный доступ:', productsBucket.public ? 'Да' : 'Нет');

      // Проверяем файлы в bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('products')
        .list();

      if (!filesError) {
        console.log('   Количество файлов:', files?.length || 0);
      }

      // Генерируем публичный URL для примера
      const testUrl = supabase.storage
        .from('products')
        .getPublicUrl('test-image.jpg');

      console.log('\n📸 Пример публичного URL для изображений:');
      console.log('   ', testUrl.data.publicUrl);

    } else {
      console.log('\n❌ Bucket "products" НЕ найден!');
      console.log('   Нужно создать его через setup-storage.js');
    }

  } catch (error) {
    console.error('Ошибка:', error);
  }
}

checkStorage();