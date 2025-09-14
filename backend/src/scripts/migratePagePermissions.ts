import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { getDefaultPermissions, UserRole } from '../types/permissions';

// Load environment variables
dotenv.config();

async function migratePagePermissions() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cartracking';
    await mongoose.connect(mongoUri);
    
    console.log('Connected to MongoDB');
    
    // Find all users that don't have pagePermissions or have empty pagePermissions
    const users = await User.find({
      $or: [
        { pagePermissions: { $exists: false } },
        { pagePermissions: { $eq: [] } },
        { pagePermissions: null }
      ]
    });
    
    console.log(`Found ${users.length} users to migrate`);
    
    if (users.length === 0) {
      console.log('No users need migration');
      return;
    }
    
    // Update each user with default permissions based on their role
    for (const user of users) {
      const defaultPermissions = getDefaultPermissions(user.role as UserRole);
      
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            pagePermissions: defaultPermissions,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log(`Updated user ${user.email} (${user.role}) with ${defaultPermissions.length} permissions:`, defaultPermissions);
    }
    
    console.log('Migration completed successfully!');
    
    // Verify migration results
    const updatedUsers = await User.find({
      pagePermissions: { $exists: true, $ne: [] }
    });
    
    console.log(`\n✅ Migration Results:`);
    console.log(`- Total users with pagePermissions: ${updatedUsers.length}`);
    
    // Count by role
    const roleStats = await User.aggregate([
      { $group: { 
        _id: '$role', 
        count: { $sum: 1 },
        avgPermissions: { $avg: { $size: '$pagePermissions' } }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📊 Users by Role:');
    roleStats.forEach(stat => {
      console.log(`- ${stat._id}: ${stat.count} users (avg ${Math.round(stat.avgPermissions)} permissions)`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Rollback function to remove pagePermissions field
async function rollbackPagePermissions() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cartracking';
    await mongoose.connect(mongoUri);
    
    console.log('Connected to MongoDB for rollback');
    
    const result = await User.updateMany(
      {},
      { $unset: { pagePermissions: "" } }
    );
    
    console.log(`Rollback completed: Removed pagePermissions from ${result.modifiedCount} users`);
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    if (command === 'rollback') {
      console.log('🔄 Starting rollback...');
      await rollbackPagePermissions();
    } else {
      console.log('🚀 Starting migration...');
      await migratePagePermissions();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Operation failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  main();
}

export { migratePagePermissions, rollbackPagePermissions };
