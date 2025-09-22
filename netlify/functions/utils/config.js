/**
 * Enterprise-level configuration for Netlify Functions
 * Centralized configuration with validation and fallbacks
 */

class FunctionConfig {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  loadConfig() {
    return {
      // Frontend URL with multiple fallback strategies
      frontendUrl: this.getFrontendUrl(),

      // Stripe configuration
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      stripeWebhookSecretOrders: process.env.STRIPE_WEBHOOK_SECRET_ORDERS,

      // Supabase configuration
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

      // JWT configuration
      jwtSecret: process.env.JWT_SECRET,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

      // Environment
      environment: process.env.NODE_ENV || 'production',
      isProduction: process.env.NODE_ENV === 'production',
    };
  }

  getFrontendUrl() {
    // Priority order for determining frontend URL

    // 1. Netlify's automatic URL (most reliable)
    if (process.env.URL) {
      return process.env.URL;
    }

    // 2. Explicitly configured URL
    if (process.env.FRONTEND_URL) {
      return process.env.FRONTEND_URL;
    }

    // 3. Deploy URL (Netlify specific)
    if (process.env.DEPLOY_URL) {
      return process.env.DEPLOY_URL;
    }

    // 4. Site name based URL (Netlify specific)
    if (process.env.SITE_NAME) {
      return `https://${process.env.SITE_NAME}.netlify.app`;
    }

    // 5. Production fallback
    return 'https://ositosbendecidos.com';
  }

  validateConfig() {
    const requiredVars = [
      'stripeSecretKey',
      'supabaseUrl',
      'supabaseServiceKey',
      'jwtSecret',
    ];

    const missingVars = requiredVars.filter(key => !this.config[key]);

    if (missingVars.length > 0) {
      console.error('[Config] Missing required environment variables:', missingVars);

      // In production, we should fail fast
      if (this.config.isProduction) {
        throw new Error(`Missing required configuration: ${missingVars.join(', ')}`);
      }
    }

    console.log('[Config] Frontend URL configured as:', this.config.frontendUrl);
  }

  get(key) {
    return this.config[key];
  }

  getStripeConfig() {
    return {
      secretKey: this.config.stripeSecretKey,
      webhookSecret: this.config.stripeWebhookSecret,
      webhookSecretOrders: this.config.stripeWebhookSecretOrders,
    };
  }

  getSupabaseConfig() {
    return {
      url: this.config.supabaseUrl,
      serviceKey: this.config.supabaseServiceKey,
    };
  }

  getCheckoutUrls() {
    const baseUrl = this.config.frontendUrl;
    return {
      success: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel: `${baseUrl}/cart`,
    };
  }
}

// Export singleton instance
let configInstance;

function getConfig() {
  if (!configInstance) {
    configInstance = new FunctionConfig();
  }
  return configInstance;
}

module.exports = {
  getConfig,
  FunctionConfig,
};