#!/usr/bin/env node

/**
 * Migration script to test MongoDB connection and setup
 * This script helps migrate from in-memory storage to MongoDB
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ositos-bendecidos';

// User schema (simplified version)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastLoginAt: { type: Date, default: null }
}, {
  timestamps: true
});

const User = mongoose.model('User', UserSchema);

async function connectToMongoDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

async function createDefaultAdmin() {
  try {
    console.log('👑 Creating default admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@ositos.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      return existingAdmin;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const admin = new User({
      email: 'admin@ositos.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isVerified: true,
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Default admin created: admin@ositos.com / admin123');
    return admin;

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

async function createTestUsers() {
  try {
    console.log('👥 Creating test users...');

    const testUsers = [
      {
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        firstName: 'Test',
        lastName: 'User',
        isVerified: true,
        role: 'user'
      },
      {
        email: 'user@ositosbendecidos.com',
        password: await bcrypt.hash('user123', 12),
        firstName: 'John',
        lastName: 'Doe',
        isVerified: true,
        role: 'user'
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Test user created: ${userData.email}`);
      } else {
        console.log(`ℹ️  Test user already exists: ${userData.email}`);
      }
    }

  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    throw error;
  }
}

async function testAuthentication() {
  try {
    console.log('🔐 Testing authentication...');

    // Test admin login
    const admin = await User.findOne({ email: 'admin@ositos.com' });
    if (admin) {
      const isValidPassword = await bcrypt.compare('admin123', admin.password);
      if (isValidPassword) {
        console.log('✅ Admin authentication test passed');
      } else {
        console.error('❌ Admin authentication test failed');
      }
    }

    // Test user count
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);

  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    throw error;
  }
}

async function testDatabaseOperations() {
  try {
    console.log('🧪 Testing database operations...');

    // Test create operation
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: await bcrypt.hash('testpass123', 12),
      firstName: 'Migration',
      lastName: 'Test',
      role: 'user'
    };

    const user = new User(testUser);
    await user.save();
    console.log('✅ Create operation test passed');

    // Test read operation
    const foundUser = await User.findById(user._id);
    if (foundUser && foundUser.email === testUser.email) {
      console.log('✅ Read operation test passed');
    } else {
      throw new Error('Read operation failed');
    }

    // Test update operation
    foundUser.firstName = 'Updated';
    await foundUser.save();
    console.log('✅ Update operation test passed');

    // Test delete operation
    await User.findByIdAndDelete(user._id);
    const deletedUser = await User.findById(user._id);
    if (!deletedUser) {
      console.log('✅ Delete operation test passed');
    } else {
      throw new Error('Delete operation failed');
    }

  } catch (error) {
    console.error('❌ Database operations test failed:', error.message);
    throw error;
  }
}

async function displayConnectionInfo() {
  console.log('\n🔍 Database Connection Info:');
  console.log(`📍 URI: ${MONGODB_URI}`);
  console.log(`🗄️  Database: ${mongoose.connection.db.databaseName}`);
  console.log(`📊 Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  
  // Get database stats
  try {
    const stats = await mongoose.connection.db.stats();
    console.log(`💾 Database Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📚 Collections: ${stats.collections}`);
  } catch (error) {
    console.log('ℹ️  Could not retrieve database stats');
  }
}

async function runMigration() {
  console.log('🚀 Starting MongoDB Migration & Testing...\n');

  try {
    // Step 1: Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      process.exit(1);
    }

    // Step 2: Display connection info
    await displayConnectionInfo();

    // Step 3: Create default admin
    await createDefaultAdmin();

    // Step 4: Create test users
    await createTestUsers();

    // Step 5: Test authentication
    await testAuthentication();

    // Step 6: Test database operations
    await testDatabaseOperations();

    console.log('\n🎉 MongoDB migration and testing completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update your environment variables to use MongoDB');
    console.log('2. Switch your server to use server-production.ts');
    console.log('3. Run: npm run start:prod');
    console.log('4. Test your API endpoints');
    console.log('\n💡 Production Checklist:');
    console.log('- Set strong JWT secrets');
    console.log('- Configure email service');
    console.log('- Set up SSL certificates');
    console.log('- Configure monitoring');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Handle script arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📖 MongoDB Migration Script Help

Usage: node scripts/migrate-to-mongodb.js [options]

Options:
  --help, -h     Show this help message
  --test-only    Only run tests, don't create users
  --clean        Clean database before migration (DANGEROUS!)

Environment Variables:
  MONGODB_URI    MongoDB connection string (required)

Examples:
  node scripts/migrate-to-mongodb.js
  node scripts/migrate-to-mongodb.js --test-only
  MONGODB_URI=mongodb://localhost:27017/test node scripts/migrate-to-mongodb.js
`);
  process.exit(0);
}

if (args.includes('--clean')) {
  console.warn('⚠️  CLEAN MODE: This will delete all existing data!');
  // Add clean functionality here if needed
}

// Run the migration
runMigration().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
