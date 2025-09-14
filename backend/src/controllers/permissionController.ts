import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import { 
  PAGE_PERMISSIONS, 
  PagePermission, 
  UserRole,
  UserPermissionsResponse,
  AvailablePermissionsResponse,
  getPermissionLabel,
  getPermissionDescription,
  canManageUser,
  ALL_PERMISSIONS,
  getDefaultPermissions
} from '../types/permissions';
import { AuthenticatedRequest } from '../Middleware/authMiddleware';

export class PermissionController {
  
  // Validation rules
  static validateUserId = [
    param('id').isMongoId().withMessage('Invalid user ID format')
  ];

  static validatePermissions = [
    body('pagePermissions')
      .isArray()
      .withMessage('pagePermissions must be an array')
      .custom((permissions: string[]) => {
        const invalid = permissions.filter(p => !ALL_PERMISSIONS.includes(p as PagePermission));
        if (invalid.length > 0) {
          throw new Error(`Invalid permissions: ${invalid.join(', ')}`);
        }
        return true;
      })
  ];

  // ดึงสิทธิ์ของผู้ใช้
  static async getUserPermissions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'ข้อมูลไม่ถูกต้อง',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const requestingUser = req.user as IUser;

      if (!requestingUser) {
        return res.status(401).json({
          success: false,
          message: 'ไม่ได้รับการยืนยันตัวตน'
        });
      }

      // Authorization check
      if (requestingUser.id !== id && !canManageUser(requestingUser, { id, role: 'user' })) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์ดูข้อมูลผู้ใช้นี้'
        });
      }

      // Find user
      const user = await User.findById(id).select('pagePermissions role email firstName lastName');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      // Response
      const response: UserPermissionsResponse = {
        success: true,
        data: {
          userId: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          pagePermissions: user.getPermissions()
        }
      };

      return res.json(response);

    } catch (error) {
      console.error('Error getting user permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
      });
    }
  }

  // อัปเดตสิทธิ์ผู้ใช้
  static async updateUserPermissions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'ข้อมูลไม่ถูกต้อง',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { pagePermissions }: { pagePermissions: PagePermission[] } = req.body;
      const requestingUser = req.user as IUser;

      if (!requestingUser) {
        return res.status(401).json({
          success: false,
          message: 'ไม่ได้รับการยืนยันตัวตน'
        });
      }

      // Find target user
      const targetUser = await User.findById(id);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      // Authorization check
      if (!canManageUser(requestingUser, targetUser)) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์จัดการผู้ใช้นี้'
        });
      }

      // Special permission check - Manager cannot assign management permission
      if (requestingUser.role === 'manager' && pagePermissions.includes(PAGE_PERMISSIONS.USER_MANAGEMENT)) {
        return res.status(403).json({
          success: false,
          message: 'Manager ไม่สามารถให้สิทธิ์การจัดการผู้ใช้ได้'
        });
      }

      // Update permissions
      targetUser.pagePermissions = pagePermissions;
      targetUser.updatedAt = new Date();
      await targetUser.save();

      // Audit log (optional)
      console.log(`User ${requestingUser.email} updated permissions for ${targetUser.email}:`, pagePermissions);

      // Response
      return res.json({
        success: true,
        message: 'อัปเดตสิทธิ์สำเร็จ',
        data: {
          userId: targetUser._id.toString(),
          email: targetUser.email,
          name: `${targetUser.firstName} ${targetUser.lastName}`,
          pagePermissions: targetUser.pagePermissions
        }
      });

    } catch (error) {
      console.error('Error updating user permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปเดต'
      });
    }
  }

  // ดึงรายการ permissions ที่มี
  static async getAvailablePermissions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const requestingUser = req.user as IUser;
      
      if (!requestingUser) {
        return res.status(401).json({
          success: false,
          message: 'ไม่ได้รับการยืนยันตัวตน'
        });
      }
      
      let availablePermissions = Object.entries(PAGE_PERMISSIONS).map(([key, value]) => ({
        key,
        value,
        label: getPermissionLabel(value),
        description: getPermissionDescription(value)
      }));

      // Manager cannot see USER_MANAGEMENT permission
      if (requestingUser.role === 'manager') {
        availablePermissions = availablePermissions.filter(
          p => p.value !== PAGE_PERMISSIONS.USER_MANAGEMENT
        );
      }

      const response: AvailablePermissionsResponse = {
        success: true,
        data: availablePermissions
      };

      return res.json(response);

    } catch (error) {
      console.error('Error getting available permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
      });
    }
  }

  // Get current user's permissions
  static async getCurrentUserPermissions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const user = req.user as IUser;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'ไม่ได้รับการยืนยันตัวตน'
        });
      }

      const response: UserPermissionsResponse = {
        success: true,
        data: {
          userId: (user._id as any).toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          pagePermissions: user.getPermissions()
        }
      };

      return res.json(response);

    } catch (error) {
      console.error('Error getting current user permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
      });
    }
  }

  // Get user permissions for frontend menu filtering
  static async getMenuConfig(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const user = req.user as IUser;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'ไม่ได้รับการยืนยันตัวตน'
        });
      }

      const userPermissions = user.getPermissions();

      return res.json({
        success: true,
        data: {
          user: {
            userId: (user._id as any).toString(),
            name: `${user.firstName} ${user.lastName}`,
            role: user.role
          },
          permissions: userPermissions
        }
      });

    } catch (error) {
      console.error('Error getting menu config:', error);
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเมนู'
      });
    }
  }

  // Update all users' permissions to default (for migration)
  static async updateAllUsersPermissions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const requestingUser = req.user as IUser;
      
      if (!requestingUser) {
        return res.status(401).json({
          success: false,
          message: 'ไม่ได้รับการยืนยันตัวตน'
        });
      }

      // Only super admin can run this migration
      if (requestingUser.role !== 'super admin') {
        return res.status(403).json({
          success: false,
          message: 'เฉพาะ Super Admin เท่านั้นที่สามารถรันการอัปเดตนี้ได้'
        });
      }

      // Find all users
      const users = await User.find({});
      let updatedCount = 0;
      let skippedCount = 0;

      for (const user of users) {
        // ถ้า user ยังไม่มี pagePermissions หรือเป็น array ว่าง
        if (!user.pagePermissions || user.pagePermissions.length === 0) {
          const defaultPermissions = getDefaultPermissions(user.role);
          user.pagePermissions = defaultPermissions;
          await user.save();
          updatedCount++;
        } else {
          skippedCount++;
        }
      }

      return res.json({
        success: true,
        message: 'อัปเดต permissions สำเร็จ',
        data: {
          totalUsers: users.length,
          updated: updatedCount,
          skipped: skippedCount
        }
      });

    } catch (error) {
      console.error('Error updating all users permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปเดต permissions'
      });
    }
  }
}

export default PermissionController;
