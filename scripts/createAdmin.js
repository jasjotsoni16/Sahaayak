const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' }); // Load .env from backend_new directory

const User = require('../Model/User'); // Adjust path if necessary

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const createAdminUser = async () => {
  await connectDB();

  const phoneNumber = 'admin';
  const password = 'admin';
  const email = 'admin@sahaayak.com';
  const name = 'Sahaayak Admin';

  try {
    let user = await User.findOne({ phone_number: phoneNumber });

    if (user) {
      console.log(`User with phone number ${phoneNumber} already exists. Updating role to admin.`);
      user.role = 'admin';
      await user.save();
      console.log('Admin user updated successfully!');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      phone_number: phoneNumber,
      email,
      password: hashedPassword,
      role: 'admin',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // Delhi coordinates as default
      },
      city: 'Delhi',
      language: 'en'
    });

    await user.save();
    console.log('Admin user created successfully!');
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

createAdminUser();
