import mongoose from 'mongoose';
import User from '../models/User';
import { getDefaultPermissions } from '../types/permissions';
import connectDB from '../utils/database';

async function updateUserPermissions() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    // ค้นหา user ทั้งหมด
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // ถ้า user ยังไม่มี pagePermissions หรือเป็น array ว่าง
      if (!user.pagePermissions || user.pagePermissions.length === 0) {
        const defaultPermissions = getDefaultPermissions(user.role);
        user.pagePermissions = defaultPermissions;
        await user.save();
        
        console.log(`✅ Updated ${user.email} (${user.role}): ${defaultPermissions.join(', ')}`);
        updatedCount++;
      } else {
        console.log(`⏩ Skipped ${user.email} (${user.role}): Already has permissions`);
        skippedCount++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Updated: ${updatedCount} users`);
    console.log(`   Skipped: ${skippedCount} users`);
    console.log(`✅ User permissions update completed!`);

  } catch (error) {
    console.error('❌ Error updating user permissions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  updateUserPermissions();
}

export default updateUserPermissions;
