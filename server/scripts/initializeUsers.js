const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config();

const getDefaultUsers = () => {
  const users = [];

  // Admin user
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    users.push({
      username: process.env.ADMIN_USERNAME || 'Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin'
    });
  }

  // Additional users from comma-separated env vars
  if (process.env.USERS) {
    try {
      const userList = JSON.parse(process.env.USERS);
      users.push(...userList);
    } catch (error) {
      console.warn('Could not parse USERS env var, skipping additional users');
    }
  }

  // Fallback to default admin user if no env vars provided
  if (users.length === 0) {
    users.push({
      username: 'Admin',
      email: 'admin@nuestrabiblioteca.com',
      password: 'admin123',
      role: 'admin'
    });
  }

  return users;
};

const DEFAULT_USERS = getDefaultUsers();

async function initializeUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nuestrabiblioteca');
    console.log('Connected to MongoDB');

    for (const userData of DEFAULT_USERS) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✓ Created user: ${userData.email}`);
      } else {
        console.log(`✓ User already exists: ${userData.email}`);
      }
    }

    console.log('User initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing users:', error);
    process.exit(1);
  }
}

initializeUsers();
