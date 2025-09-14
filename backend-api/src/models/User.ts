export interface User {
  id: string;
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  isVerified: boolean;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

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

// In-memory storage (replace with database in production)
const users: User[] = [
  {
    id: 'admin-1',
    email: 'admin@ositos.com',
    password: '$2b$12$bUL96QdPVbmo6xcU7t79N.SAwWNLANQJqGL7Zv5J.aiR/AW3pTP3a', // admin123
    firstName: 'Admin',
    lastName: 'User',
    isVerified: true,
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class UserModel {
  private static generateId(): string {
    return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  static async findByEmail(email: string): Promise<User | null> {
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async findById(id: string): Promise<User | null> {
    return users.find(user => user.id === id) || null;
  }

  static async create(userData: CreateUserData): Promise<User> {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      id: this.generateId(),
      email: userData.email.toLowerCase(),
      password: userData.password, // Should be hashed before calling this
      firstName: userData.firstName,
      lastName: userData.lastName,
      isVerified: false,
      role: userData.role || 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    return newUser;
  }

  static async updateLastLogin(id: string): Promise<void> {
    const user = users.find(u => u.id === id);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
    }
  }

  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return null;
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return users[userIndex];
  }

  static async getAllUsers(): Promise<UserProfile[]> {
    return users.map(user => this.toProfile(user));
  }

  static toProfile(user: User): UserProfile {
    const { password, ...profile } = user;
    return profile;
  }
}
