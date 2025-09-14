import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://rqqqkquovwvsegaluxwe.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcXFrcXVvdnd2c2VnYWx1eHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTMyODUsImV4cCI6MjA3MTY2OTI4NX0.KQW2SGRvApZomrUdptF6zmhl8GXRXHP4DbcNA8y5gzg';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcXFrcXVvdnd2c2VnYWx1eHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA5MzI4NSwiZXhwIjoyMDcxNjY5Mjg1fQ.T5U8fimUYQGsqCEgadbo6EKqNVaWwKSY81c81sroP3A';

// Create Supabase client for public operations (with anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Create Supabase admin client for server-side operations (with service key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  avatar_url?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLoginAt?: string;
}

// Helper function to transform database user to API format
export const transformUser = (dbUser: User): UserProfile => {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    isVerified: dbUser.is_verified,
    avatar: dbUser.avatar_url,
    role: dbUser.role,
    createdAt: dbUser.created_at,
    lastLoginAt: dbUser.last_login_at
  };
};

// Helper function to transform API user to database format
export const transformToDbUser = (apiUser: Partial<UserProfile>): Partial<User> => {
  const dbUser: Partial<User> = {};
  
  if (apiUser.firstName) dbUser.first_name = apiUser.firstName;
  if (apiUser.lastName) dbUser.last_name = apiUser.lastName;
  if (apiUser.avatar) dbUser.avatar_url = apiUser.avatar;
  if (apiUser.role) dbUser.role = apiUser.role;
  if (apiUser.isVerified !== undefined) dbUser.is_verified = apiUser.isVerified;
  
  return dbUser;
};

// Configuration validation
export const validateSupabaseConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
    errors.push('Invalid SUPABASE_URL');
  }

  if (!supabaseAnonKey || !supabaseAnonKey.startsWith('eyJ')) {
    errors.push('Invalid SUPABASE_ANON_KEY');
  }

  if (!supabaseServiceKey || !supabaseServiceKey.startsWith('eyJ')) {
    errors.push('Invalid SUPABASE_SERVICE_ROLE_KEY');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Test connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Test with admin client to bypass RLS
    const { data, error } = await supabaseAdmin.from('users').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};
