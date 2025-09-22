/**
 * Enterprise-level environment configuration
 * Centralized configuration management with validation
 */

interface EnvironmentConfig {
  apiUrl: string;
  frontendUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripePublishableKey: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.validateAndLoadConfig();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private validateAndLoadConfig(): EnvironmentConfig {
    const isDevelopment = import.meta.env.MODE === 'development';
    const isProduction = import.meta.env.MODE === 'production';

    // Required environment variables
    const requiredVars = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    };

    // Validate required variables
    const missingVars = Object.entries(requiredVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0 && isProduction) {
      console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Determine URLs with fallbacks
    const frontendUrl = this.determineFrontendUrl();
    const apiUrl = `${frontendUrl}/.netlify/functions`;

    return {
      apiUrl,
      frontendUrl,
      supabaseUrl: requiredVars.supabaseUrl || '',
      supabaseAnonKey: requiredVars.supabaseAnonKey || '',
      stripePublishableKey: requiredVars.stripePublishableKey || '',
      isDevelopment,
      isProduction,
    };
  }

  private determineFrontendUrl(): string {
    // Priority order for URL determination
    // 1. Explicit environment variable
    if (import.meta.env.VITE_FRONTEND_URL) {
      return import.meta.env.VITE_FRONTEND_URL;
    }

    // 2. Current window location (for production)
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }

    // 3. Default for development
    if (import.meta.env.MODE === 'development') {
      return 'http://localhost:5173';
    }

    // 4. Production fallback
    return 'https://ositosbendecidos.com';
  }

  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  public get(key: keyof EnvironmentConfig): any {
    return this.config[key];
  }

  // Helper methods for common use cases
  public getApiEndpoint(path: string): string {
    return `${this.config.apiUrl}/${path}`;
  }

  public getFrontendUrl(path: string = ''): string {
    return `${this.config.frontendUrl}${path}`;
  }
}

// Export singleton instance
export const env = EnvironmentManager.getInstance();
export default env;