#!/bin/bash

# КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ - Netlify требует специальную структуру!

echo "🚨 ИСПРАВЛЯЕМ DEPLOYMENT ДЛЯ NETLIFY FUNCTIONS..."

# Удаляем старые файлы
rm -rf netlify-final-fix/
rm -f netlify-final-fix.zip

# Создаем правильную структуру
mkdir -p netlify-final-fix

# 1. Frontend файлы в корень
echo "📁 Копируем frontend..."
cp -r dist/* netlify-final-fix/

# 2. КРИТИЧНО: Functions должны быть В КОРНЕ в папке netlify/functions
echo "⚡ Создаем правильную структуру functions..."
mkdir -p netlify-final-fix/netlify/functions

# Копируем функции БЕЗ node_modules
for func in auth products orders payments prayers community testimonials admin; do
    if [ -f "netlify/functions/${func}.js" ]; then
        cp "netlify/functions/${func}.js" "netlify-final-fix/netlify/functions/"
        echo "  ✓ Скопирован ${func}.js"
    fi
done

# 3. ВАЖНО: netlify.toml ДОЛЖЕН быть в корне
cp netlify.toml netlify-final-fix/

# 4. Package.json для Netlify (не для functions!)
cat > netlify-final-fix/package.json << 'EOF'
{
  "name": "ositos-bendecidos-netlify",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@supabase/supabase-js": "^2.39.1",
    "stripe": "^14.10.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1"
  }
}
EOF

# 5. Создаем .gitignore чтобы Netlify не игнорировал функции
cat > netlify-final-fix/.gitignore << 'EOF'
node_modules/
.env
.env.local
EOF

# 6. Создаем архив
echo "📦 Создаем финальный архив..."
cd netlify-final-fix
zip -r ../netlify-final-fix.zip . -x "*.DS_Store" -x "__MACOSX/*"
cd ..

echo "✅ ГОТОВО!"
echo ""
echo "🎯 ИНСТРУКЦИЯ:"
echo "1. Загрузи netlify-final-fix.zip на Netlify"
echo "2. После загрузки перейди в Functions tab"
echo "3. Если функции не появились, проверь Build log"
echo ""
echo "📍 Файл: $(pwd)/netlify-final-fix.zip"