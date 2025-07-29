import { connectToDatabase } from '../server/mongodb';
import mongoose from 'mongoose';

async function clearDatabase() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // Drop the entire database to start fresh
    await mongoose.connection.db.dropDatabase();
    console.log('Database cleared successfully');
    
    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

clearDatabase();
