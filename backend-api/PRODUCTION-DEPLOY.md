# 🚀 PRODUCTION DEPLOYMENT GUIDE - Ositos Bendecidos

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ 1. Database Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user with appropriate permissions
- [ ] Network access configured (IP whitelist)
- [ ] Connection string obtained

### ✅ 2. Environment Variables
- [ ] Strong JWT secrets generated (32+ characters)
- [ ] Production MongoDB URI configured
- [ ] Email service configured (SendGrid/Gmail/SMTP)
- [ ] Stripe live keys configured
- [ ] CORS origins set to production domains
- [ ] All sensitive data in environment variables

### ✅ 3. Security
- [ ] HTTPS certificate obtained
- [ ] Domain configured
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Production secrets rotation plan

### ✅ 4. Monitoring
- [ ] Error tracking setup (Sentry recommended)
- [ ] Log aggregation configured
- [ ] Performance monitoring
- [ ] Uptime monitoring

## 🔧 ENVIRONMENT SETUP

### Required Environment Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ositos-bendecidos?retryWrites=true&w=majority

# JWT Security (GENERATE STRONG SECRETS!)
JWT_SECRET=your-super-secret-256-bit-key-for-production
JWT_REFRESH_SECRET=different-super-secret-256-bit-refresh-key
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Email Service
EMAIL_SERVICE=sendgrid
EMAIL_FROM=noreply@ositosbendecidos.com
ADMIN_EMAIL=admin@ositosbendecidos.com

# For SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# PayPal Live
PAYPAL_CLIENT_ID=your_paypal_live_client_id
PAYPAL_CLIENT_SECRET=your_paypal_live_client_secret

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=your-sentry-dsn-for-error-tracking
```

## 🏗️ DEPLOYMENT OPTIONS

### Option 1: VPS/Dedicated Server (Recommended)

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx
```

#### 2. Application Deployment
```bash
# Clone repository
git clone your-repo-url
cd ositos-bendecidos/backend-api

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Set up environment variables
sudo nano /etc/environment
# Add your production environment variables

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. SSL Certificate
```bash
sudo certbot --nginx -d api.yourdomain.com
```

### Option 2: Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3001

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      # ... other env vars
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

### Option 3: Cloud Platforms

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create ositos-bendecidos-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
# ... set all required env vars

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
```yaml
name: ositos-bendecidos-api
services:
- name: api
  source_dir: /backend-api
  github:
    repo: your-username/your-repo
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: MONGODB_URI
    value: your-mongodb-uri
    type: SECRET
  # ... other env vars
```

## 🔒 SECURITY BEST PRACTICES

### 1. Secrets Management
```bash
# Generate strong secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET

# Use different secrets for different environments
# Rotate secrets regularly
```

### 2. Database Security
- Enable MongoDB authentication
- Use connection string with SSL
- Restrict database user permissions
- Regular backups with encryption

### 3. Network Security
- Use HTTPS everywhere
- Configure firewall (UFW/iptables)
- Limit database access to application servers
- Use VPN for admin access

### 4. Application Security
- Regular dependency updates
- Security scanning (npm audit)
- Input validation on all endpoints
- Rate limiting on sensitive endpoints

## 📊 MONITORING & LOGGING

### 1. Error Tracking (Sentry)
```bash
npm install @sentry/node @sentry/tracing
```

### 2. Log Management
```javascript
// Use structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 3. Performance Monitoring
- Monitor response times
- Track memory usage
- Database query performance
- API endpoint usage

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app/ositos-bendecidos/backend-api
            git pull origin main
            npm ci --production
            npm run build
            pm2 restart ositos-api
```

## 🔧 MAINTENANCE

### 1. Regular Updates
```bash
# Weekly security updates
npm audit fix
npm update

# Monthly dependency updates
npm outdated
npm update --save
```

### 2. Database Maintenance
```bash
# MongoDB backups
mongodump --uri="mongodb+srv://..." --out=backup-$(date +%Y%m%d)

# Index optimization
db.users.getIndexes()
db.users.reIndex()
```

### 3. SSL Certificate Renewal
```bash
# Auto-renewal with certbot
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚨 TROUBLESHOOTING

### Common Issues

1. **Database Connection Fails**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string
   - Check network connectivity

2. **JWT Token Issues**
   - Verify JWT secrets are set
   - Check token expiration times
   - Validate token format

3. **Email Not Sending**
   - Verify email service credentials
   - Check SMTP settings
   - Test email service separately

4. **High Memory Usage**
   - Monitor for memory leaks
   - Check database query efficiency
   - Optimize image uploads

### Performance Optimization

1. **Database Optimization**
   - Add proper indexes
   - Use aggregation pipelines
   - Enable compression

2. **API Optimization**
   - Implement caching (Redis)
   - Use compression middleware
   - Optimize payload sizes

3. **Security Headers**
   - Use Helmet.js
   - Implement CSRF protection
   - Add rate limiting

## 📞 SUPPORT

For production support:
- Monitor error logs regularly
- Set up alerts for critical errors
- Have rollback plan ready
- Document all configuration changes

---

**IMPORTANT**: Test all configurations in staging environment before production deployment!
