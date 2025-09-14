#!/bin/bash

echo "🚀 Подготовка к деплою на Netlify..."

# Удаляем старые архивы
rm -f netlify-ready-*.zip

# Собираем frontend
echo "📦 Собираем frontend..."
npm run build

# Создаем временную папку для деплоя
rm -rf netlify-deploy-temp
mkdir -p netlify-deploy-temp

# Копируем frontend файлы в корень
echo "📁 Копируем файлы..."
cp -r dist/* netlify-deploy-temp/

# Копируем функции и конфиг
cp -r netlify netlify-deploy-temp/
cp netlify.toml netlify-deploy-temp/

# Устанавливаем зависимости для функций
echo "📥 Устанавливаем зависимости функций..."
cd netlify-deploy-temp/netlify/functions
npm install --production
cd ../../..

# Создаем архив
echo "🗜️ Создаем архив..."
cd netlify-deploy-temp
zip -r ../netlify-ready-$(date +%Y%m%d-%H%M%S).zip . -q
cd ..

# Удаляем временную папку
rm -rf netlify-deploy-temp

echo "✅ Готово! Архив создан: netlify-ready-*.zip"
echo ""
echo "📋 Инструкция:"
echo "1. Зайдите в Netlify Dashboard"
echo "2. Перетащите созданный архив в Deploys"
echo "3. Убедитесь что все переменные окружения добавлены"
echo ""
echo "🔧 В Site configuration проверьте:"
echo "- Build command: оставьте пустым"
echo "- Publish directory: оставьте пустым"
echo "- Functions directory: netlify/functions"