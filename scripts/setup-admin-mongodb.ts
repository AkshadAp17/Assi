import { connectToDatabase } from '../server/mongodb';
import { User } from '../shared/mongoose-schema';
import bcrypt from 'bcryptjs';

async function setupAdmin() {
  try {
    await connectToDatabase();
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gamedev.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail);
      return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash,
      role: 'admin',
      profileImageUrl: null,
    });
    
    await adminUser.save();
    console.log('Admin user created successfully:', adminEmail);
    
    // Create some sample data
    await createSampleData();
    
  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    process.exit(0);
  }
}

async function createSampleData() {
  try {
    // Create sample project lead
    const leadPasswordHash = await bcrypt.hash('lead123', 12);
    const projectLead = new User({
      email: 'lead@pixelforge.com',
      firstName: 'Project',
      lastName: 'Lead',
      passwordHash: leadPasswordHash,
      role: 'project_lead',
    });
    await projectLead.save();
    
    // Create sample developer
    const devPasswordHash = await bcrypt.hash('dev123', 12);
    const developer = new User({
      email: 'dev@pixelforge.com',
      firstName: 'Game',
      lastName: 'Developer',
      passwordHash: devPasswordHash,
      role: 'developer',
    });
    await developer.save();
    
    console.log('Sample users created successfully');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

setupAdmin();