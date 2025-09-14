import mongoose, { Document, Schema, Model } from 'mongoose';
import { PasswordUtils } from '../utils/password';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
}

// Interface for static methods
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  createDefaultAdmin(): Promise<IUser | null>;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Never return password in JSON
      return ret;
    }
  }
});

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Pre-save hook to hash password
UserSchema.pre<IUser>('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await PasswordUtils.hash(this.password);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await PasswordUtils.compare(candidatePassword, this.password);
};

// Static method to find by email
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to create admin user if not exists
UserSchema.statics.createDefaultAdmin = async function() {
  try {
    const adminExists = await User.findByEmail('admin@ositos.com');
    
    if (!adminExists) {
      const admin = new this({
        email: 'admin@ositos.com',
        password: 'admin123', // Will be hashed by pre-save hook
        firstName: 'Admin',
        lastName: 'User',
        isVerified: true,
        role: 'admin'
      });
      
      await admin.save();
      console.log('✅ Default admin user created: admin@ositos.com / admin123');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

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
  createdAt: Date;
  lastLoginAt?: Date;
}

// Create and export the User model
export const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

// Database connection utility
export class DatabaseConnection {
  private static isConnected = false;

  static async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ositos-bendecidos';
      
      await mongoose.connect(mongoUri, {
        // Modern mongoose doesn't need these options
        // but you can add them if needed for older versions
      });

      this.isConnected = true;
      console.log('🚀 Connected to MongoDB successfully');

      // Create default admin user
      await User.createDefaultAdmin();

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('📡 MongoDB disconnected');
        this.isConnected = false;
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('📡 Disconnected from MongoDB');
    }
  }

  static isDbConnected(): boolean {
    return this.isConnected;
  }
}

// Production-ready User service class
export class UserService {
  static async findByEmail(email: string): Promise<IUser | null> {
    return await User.findByEmail(email.toLowerCase());
  }

  static async findById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id);
    } catch (error) {
      return null;
    }
  }

  static async create(userData: CreateUserData): Promise<IUser> {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = new User({
      email: userData.email.toLowerCase(),
      password: userData.password, // Will be hashed by pre-save hook
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'user'
    });

    return await user.save();
  }

  static async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { 
      lastLoginAt: new Date() 
    });
  }

  static async update(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      id, 
      { ...updates, updatedAt: new Date() }, 
      { new: true }
    );
  }

  static async getAllUsers(page = 1, limit = 10): Promise<{ users: IUser[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments()
    ]);

    return { users, total };
  }

  static async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  static toProfile(user: IUser): UserProfile {
    return {
      id: (user._id as any).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };
  }
}
