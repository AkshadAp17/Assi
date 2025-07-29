import { connectToDatabase } from '../server/mongodb';
import { User } from '../shared/mongoose-schema';
import bcrypt from 'bcryptjs';

async function setupAdmin() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@gamedev.com';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = new User({
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'User',
      passwordHash,
      role: 'admin'
    });

    await admin.save();
    console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
  } catch (error) {
    console.error('Error setting up admin:', error);
  }
}

setupAdmin().then(() => {
  console.log('MongoDB admin setup complete');
  process.exit(0);
}).catch((error) => {
  console.error('Failed to setup MongoDB admin:', error);
  process.exit(1);
});