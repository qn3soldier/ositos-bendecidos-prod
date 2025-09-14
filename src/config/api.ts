// API Configuration
// For Netlify: uses relative paths that get redirected to functions
// For local dev: uses localhost:3002
export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? '' 
    : ''
);

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  AUTH_VERIFY: `${API_BASE_URL}/api/auth/verify`,

  // Products
  PRODUCTS: `${API_BASE_URL}/api/products`,
  
  // Prayers
  PRAYERS: `${API_BASE_URL}/api/prayers`,
  
  // Community
  COMMUNITY_REQUESTS: `${API_BASE_URL}/api/community/requests`,
  
  // Testimonials
  TESTIMONIALS: `${API_BASE_URL}/api/testimonials`,
  
  // Investment
  INVESTMENT_OPPORTUNITIES: `${API_BASE_URL}/api/investment-platform/opportunities`,
  
  // Admin
  ADMIN_STATS: `${API_BASE_URL}/api/admin/stats`,
  
  // Payments
  PAYMENT_INTENT: `${API_BASE_URL}/api/payments/create-payment-intent`,
  PAYMENT_CONFIRM: `${API_BASE_URL}/api/payments/confirm`,
};

export default API_BASE_URL;