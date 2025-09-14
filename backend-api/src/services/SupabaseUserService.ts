import { supabase, supabaseAdmin, User, UserProfile, transformUser, transformToDbUser } from '../config/supabase';
import { PasswordUtils } from '../utils/password';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'user' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class SupabaseUserService {
  // Register new user
  static async register(userData: CreateUserData): Promise<{ user: UserProfile; session: any }> {
    try {
      // Validate password strength
      const passwordValidation = PasswordUtils.validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Sign up user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role || 'user'
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('User creation failed');
      }

      // The user profile is automatically created by the database trigger
      // Get the user profile
      const userProfile = await this.getUserProfile(data.user.id);
      
      if (!userProfile) {
        throw new Error('Failed to create user profile');
      }

      console.log(`✅ User registered: ${userData.email} (${data.user.id})`);

      return {
        user: userProfile,
        session: data.session
      };

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<{ user: UserProfile; session: any }> {
    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Login failed');
      }

      // Update last login time
      await this.updateLastLogin(data.user.id);

      // Get user profile
      const userProfile = await this.getUserProfile(data.user.id);
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      console.log(`✅ User logged in: ${credentials.email} (${data.user.id})`);

      return {
        user: userProfile,
        session: data.session
      };

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Get user profile by ID
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data ? transformUser(data) : null;

    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching user by email:', error);
        return null;
      }

      return data ? transformUser(data) : null;

    } catch (error) {
      console.error('Get user by email error:', error);
      return null;
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const dbUpdates = transformToDbUser(updates);
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw new Error(error.message);
      }

      console.log(`📝 Profile updated for user: ${userId}`);
      return data ? transformUser(data) : null;

    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  // Update last login time
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating last login:', error);
      }

    } catch (error) {
      console.error('Update last login error:', error);
    }
  }

  // Get all users (admin only)
  static async getAllUsers(page = 1, limit = 10): Promise<{ users: UserProfile[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      // Get users with pagination
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Get total count
      const { count, error: countError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        throw new Error(usersError.message);
      }

      if (countError) {
        console.error('Error getting user count:', countError);
      }

      return {
        users: users ? users.map(transformUser) : [],
        total: count || 0
      };

    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  // Logout user
  static async logout(sessionToken?: string): Promise<void> {
    try {
      if (sessionToken) {
        // If we have a session token, use it to sign out
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Logout error:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Delete user (admin only)
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      // Delete from auth.users (will cascade to public.users)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        console.error('Error deleting user:', error);
        throw new Error(error.message);
      }

      console.log(`🗑️ User deleted: ${userId}`);
      return true;

    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  // Create admin user (if doesn't exist)
  static async createAdminUser(): Promise<UserProfile | null> {
    try {
      // Check if admin already exists
      const existingAdmin = await this.getUserByEmail('admin@ositos.com');
      
      if (existingAdmin) {
        console.log('ℹ️  Admin user already exists');
        return existingAdmin;
      }

      console.log('👑 Creating default admin user...');

      // Create admin user
      const adminData = await this.register({
        email: 'admin@ositos.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      });

      // Update to verified and admin role
      const updatedAdmin = await this.updateUserProfile(adminData.user.id, {
        isVerified: true,
        role: 'admin'
      });

      console.log('✅ Default admin created: admin@ositos.com / admin123');
      return updatedAdmin;

    } catch (error) {
      console.error('❌ Error creating admin user:', error);
      return null;
    }
  }

  // Verify user session
  static async verifySession(sessionToken: string): Promise<UserProfile | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(sessionToken);

      if (error || !user) {
        return null;
      }

      return await this.getUserProfile(user.id);

    } catch (error) {
      console.error('Verify session error:', error);
      return null;
    }
  }

  // Get session from token
  static async getSession(accessToken: string): Promise<any> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Get session error:', error);
        return null;
      }

      return session;

    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  // Refresh session
  static async refreshSession(refreshToken: string): Promise<{ session: any; user: UserProfile } | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

      if (error || !data.session || !data.user) {
        throw new Error(error?.message || 'Session refresh failed');
      }

      const userProfile = await this.getUserProfile(data.user.id);
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      return {
        session: data.session,
        user: userProfile
      };

    } catch (error) {
      console.error('Refresh session error:', error);
      throw error;
    }
  }
}
