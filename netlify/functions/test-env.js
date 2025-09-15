exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  // Log all environment variables (safely)
  console.log('Environment check:', {
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: !!process.env.JWT_SECRET,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    NODE_ENV: process.env.NODE_ENV,
    CONTEXT: process.env.CONTEXT
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Environment variables check',
      env: {
        VITE_SUPABASE_URL_EXISTS: !!process.env.VITE_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
        STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY,
        VITE_SUPABASE_URL_LENGTH: process.env.VITE_SUPABASE_URL?.length || 0,
        ALL_ENV_KEYS: Object.keys(process.env).filter(key => !key.includes('AWS') && !key.includes('LAMBDA'))
      }
    })
  };
};