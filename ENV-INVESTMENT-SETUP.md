# Investment Form Email Configuration

## Environment Variables Setup

Add these variables to your `.env` files:

### Frontend (.env)
```bash
# API URL (для подключения к backend)
VITE_API_URL=http://localhost:3001
```

### Backend (.env)
```bash
# Email Configuration (для отправки заявок)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password  # Для Gmail используйте App Password

# Admin Email (куда отправлять заявки)
ADMIN_EMAIL=admin@ositosbendecidos.com

# SMTP Configuration (альтернатива Gmail)
# SMTP_HOST=smtp.mailtrap.io
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your_smtp_user
# SMTP_PASS=your_smtp_pass
```

## Gmail App Password Setup

1. Включите двухфакторную аутентификацию в Google Account
2. Перейдите в: https://myaccount.google.com/apppasswords
3. Создайте новый App Password для "Mail"
4. Используйте этот пароль в EMAIL_PASS

## Тестирование

1. Запустите backend: `cd backend-api && npm run dev`
2. Запустите frontend: `npm run dev`
3. Откройте страницу /invest
4. Заполните форму и отправьте
5. Проверьте консоль backend для логов
6. Проверьте email для полученных писем

## Заявки сохраняются:
- В памяти сервера (временно)
- Отправляются на ADMIN_EMAIL
- Подтверждение отправляется инвестору

## API Endpoints:
- POST `/api/investments/inquiries` - создать заявку
- GET `/api/investments/inquiries` - получить все заявки (admin)
- GET `/api/investments/inquiries/:id` - получить одну заявку
- PATCH `/api/investments/inquiries/:id/status` - обновить статус
