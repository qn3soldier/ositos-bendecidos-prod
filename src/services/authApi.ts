const API_URL = import.meta.env.VITE_API_URL || '';

interface User {
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

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  errors?: any[];
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

class AuthAPI {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('ositos_user');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_URL}/api/auth${endpoint}`;
    
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token refresh on 401
    if (response.status === 401 && this.refreshToken && endpoint !== '/refresh') {
      try {
        await this.refreshTokens();
        // Retry the original request with new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        return fetch(url, { ...options, headers });
      } catch (error) {
        // Refresh failed, clear tokens and throw error
        this.clearTokens();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.user && data.accessToken && data.refreshToken) {
        this.setTokens(data.accessToken, data.refreshToken);
        localStorage.setItem('ositos_user', JSON.stringify(data.user));
        return data.user;
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      if (!data.success) {
        if (data.errors && data.errors.length > 0) {
          throw new Error(data.errors.map(e => e.msg).join(', '));
        }
        throw new Error(data.message || 'Registration failed');
      }

      if (data.user && data.accessToken && data.refreshToken) {
        this.setTokens(data.accessToken, data.refreshToken);
        localStorage.setItem('ositos_user', JSON.stringify(data.user));
        return data.user;
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async refreshTokens(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data: AuthResponse = await response.json();

      if (!data.success || !data.accessToken || !data.refreshToken) {
        throw new Error('Token refresh failed');
      }

      this.setTokens(data.accessToken, data.refreshToken);
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response = await this.makeRequest('/profile');
      const data: AuthResponse = await response.json();

      if (!data.success || !data.user) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      // Update localStorage
      localStorage.setItem('ositos_user', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

  async updateProfile(updates: Partial<Pick<User, 'firstName' | 'lastName' | 'avatar'>>): Promise<User> {
    try {
      const response = await this.makeRequest('/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      const data: AuthResponse = await response.json();

      if (!data.success || !data.user) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update localStorage
      localStorage.setItem('ositos_user', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint if we have a token
      if (this.accessToken) {
        await this.makeRequest('/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API call fails
    } finally {
      this.clearTokens();
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('ositos_user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearTokens();
      }
    }
    return null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Create singleton instance
export const authAPI = new AuthAPI();

// Export types
export type { User, LoginCredentials, RegisterData, AuthResponse };
