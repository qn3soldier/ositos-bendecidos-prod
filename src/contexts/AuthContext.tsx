import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabaseAuthAPI, type User, migrateFromOldAuth } from '../services/authApiSupabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const user = await supabaseAuthAPI.login({ email, password });
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const user = await supabaseAuthAPI.register({ firstName, lastName, email, password });
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabaseAuthAPI.logout();

      // Simple: clear cart from localStorage
      localStorage.removeItem('cart');

      // Clear user
      setUser(null);

      // Simple reload to reset everything
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const updatedUser = await supabaseAuthAPI.updateProfile(userData);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing user session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing auth...');
      try {
        // Check for migration from old auth system
        const migrated = migrateFromOldAuth();
        if (migrated) {
          console.log('Migrated from old auth');
          setIsLoading(false);
          return;
        }

        if (supabaseAuthAPI.isAuthenticated()) {
          console.log('User is authenticated, fetching profile...');
          // Try to get fresh user data from server
          const user = await supabaseAuthAPI.getProfile();
          console.log('Profile fetched:', user);
          setUser(user);
        } else {
          console.log('User is not authenticated');
          // Try to get user from localStorage as fallback
          const savedUser = supabaseAuthAPI.getCurrentUser();
          if (savedUser) {
            console.log('Found user in localStorage:', savedUser);
            setUser(savedUser);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid session data
        await supabaseAuthAPI.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
