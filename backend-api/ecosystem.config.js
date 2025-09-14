module.exports = {
  apps: [
    {
      name: 'ositos-api',
      script: 'dist/server-production.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Production optimizations
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoring
      monitoring: false, // Set to true if using PM2 Plus
      
      // Auto-restart on file changes (development only)
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      
      // Environment variables (production should be set via .env or system)
      env_file: '.env'
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/ositos-bendecidos.git',
      path: '/var/www/ositos-bendecidos',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend-api && npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
