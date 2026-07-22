import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from './models/Organization.js';
import User from './models/User.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('MONGO_URI is not defined in env variables');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas!');

    // Clear existing users/orgs if any
    console.log('Clearing database user & organization collections...');
    await Organization.deleteMany({});
    await User.deleteMany({});

    // 1. Create organization
    console.log('Creating Organization...');
    const org = await Organization.create({
      name: 'بوتيك مودابيلا للملابس',
      ownerName: 'طه أنس',
      phone: '01143632650',
      plan: 'pro', // Give pro plan directly
      status: 'active',
      trialEndsAt: new Date('2028-01-01'),
      subscriptionExpiresAt: new Date('2028-01-01')
    });
    console.log('Organization created:', org._id);

    // 2. Create users
    console.log('Creating Users...');
    
    // Owner User
    const owner = await User.create({
      name: 'طه أنس (المالك)',
      email: 'owner@mizan.com',
      password: '01143632650taha',
      role: 'owner',
      orgId: org._id,
      branchName: 'الكل',
      status: 'active'
    });
    console.log('Owner User created:', owner.email);

    // Cashier User
    const cashier = await User.create({
      name: 'سارة أحمد',
      email: 'cashier@mizan.com',
      password: '01143632650taha',
      role: 'cashier',
      orgId: org._id,
      branchName: 'الفرع الرئيسي',
      status: 'active'
    });
    console.log('Cashier User created:', cashier.email);

    console.log('Database seeded successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
