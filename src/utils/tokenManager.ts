// Token management utility for admin panel
export const tokenManager = {
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refresh',
          refreshToken
        })
      });

      if (!response.ok) {
        this.clearTokens();
        window.location.href = '/admin/login';
        return null;
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      window.location.href = '/admin/login';
      return null;
    }
  },

  async getValidToken(): Promise<string | null> {
    let token = this.getAccessToken();

    if (!token) {
      window.location.href = '/admin/login';
      return null;
    }

    // Check if token is expired (simplified check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds

      if (Date.now() >= exp - 60000) { // Refresh if expires in less than 1 minute
        token = await this.refreshAccessToken();
      }
    } catch (error) {
      console.error('Token validation error:', error);
      token = await this.refreshAccessToken();
    }

    return token;
  }
};