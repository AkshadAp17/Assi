import mongoose from 'mongoose';

const uri = 'mongodb+srv://akmnop757:DZRGUvSDOJX1ZNxh@cluster0.ckcdqxw.mongodb.net/mydatabase';

async function checkDatabase() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check projects
    const projects = await db.collection('projects').find({}).toArray();
    console.log(`\nFound ${projects.length} projects:`);
    projects.forEach(p => {
      console.log(`- ${p.name} (ID: ${p._id})`);
    });
    
    // Check users
    const users = await db.collection('users').find({}).toArray();
    console.log(`\nFound ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ${u.email} (${u.role})`);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkDatabase();