import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdmin() {
  try {
    console.log('🔍 Проверяем админ пользователя...\n');

    // Получаем всех пользователей
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at');

    if (error) {
      console.error('Ошибка:', error);
      return;
    }

    console.log('Все пользователи в системе:');
    users.forEach(user => {
      console.log(`- ${user.email} (role: ${user.role})`);
    });

    // Проверяем конкретно админа
    const admin = users.find(u => u.email === 'admin@ositos.com');

    if (admin) {
      console.log('\n✅ Админ пользователь найден!');
      console.log('   Email:', admin.email);
      console.log('   Role:', admin.role);
      console.log('   ID:', admin.id);
    } else {
      console.log('\n❌ Админ пользователь НЕ найден!');
      console.log('   Нужно создать пользователя admin@ositos.com с паролем OsitosAdmin2025!');
    }

  } catch (error) {
    console.error('Ошибка:', error);
  }
}

checkAdmin();