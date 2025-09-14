import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { PagePermission, ALL_PERMISSIONS } from '../types/permissions';
import { AuthenticatedRequest } from './authMiddleware';

// ตรวจสอบสิทธิ์การเข้าถึงหน้าเฉพาะ
export const requirePagePermission = (requiredPermissions: PagePermission | PagePermission[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as IUser;
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'ไม่ได้รับการยืนยันตัวตน'
        });
        return;
      }

      // Convert single permission to array
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // Admin และ Super Admin ผ่านทุกสิทธิ์
      if (['admin', 'super admin'].includes(user.role.toLowerCase())) {
        next();
        return;
      }

      // ตรวจสอบว่าผู้ใช้มีสิทธิ์อย่างน้อย 1 อย่างที่ต้องการ
      const hasPermission = permissions.some(permission => {
        return user.pagePermissions && user.pagePermissions.includes(permission);
      });

      if (!hasPermission) {
        // Log unauthorized access attempt
        console.warn(`Unauthorized access attempt:`, {
          user: user.email,
          requiredPermissions: permissions,
          userPermissions: user.pagePermissions,
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้',
          requiredPermissions: permissions
        });
        return;
      }

      next();

    } catch (error) {
      console.error('Page Permission Check Error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
      });
    }
  };
};

// ตรวจสอบสิทธิ์แบบ strict (ต้องมีทุกสิทธิ์ที่ระบุ)
export const requireAllPermissions = (requiredPermissions: PagePermission | PagePermission[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as IUser;
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'ไม่ได้รับการยืนยันตัวตน'
        });
        return;
      }

      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // Admin และ Super Admin ผ่านทุกสิทธิ์
      if (['admin', 'super admin'].includes(user.role.toLowerCase())) {
        next();
        return;
      }

      // ตรวจสอบว่าผู้ใช้มีสิทธิ์ทุกอย่างที่ต้องการ
      const hasAllPermissions = permissions.every(permission => {
        return user.pagePermissions && user.pagePermissions.includes(permission);
      });

      if (!hasAllPermissions) {
        res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์เพียงพอสำหรับฟีเจอร์นี้',
          requiredPermissions: permissions
        });
        return;
      }

      next();

    } catch (error) {
      console.error('All Permissions Check Error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
      });
    }
  };
};

// ตรวจสอบสิทธิ์ตาม role (fallback)
export const requireRole = (allowedRoles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user as IUser;
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'ไม่ได้รับการยืนยันตัวตน'
        });
        return;
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      const userRole = user.role.toLowerCase();

      if (!roles.map(r => r.toLowerCase()).includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้',
          requiredRoles: roles
        });
        return;
      }

      next();

    } catch (error) {
      console.error('Role Check Error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
      });
    }
  };
};

// Utility function สำหรับตรวจสอบสิทธิ์ใน code
export const hasPagePermission = (user: IUser | undefined, permission: PagePermission): boolean => {
  if (!user) return false;
  if (['admin', 'super admin'].includes(user.role.toLowerCase())) return true;
  return user.pagePermissions && user.pagePermissions.includes(permission);
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (user: IUser | undefined, permissions: PagePermission[]): boolean => {
  if (!user) return false;
  if (['admin', 'super admin'].includes(user.role.toLowerCase())) return true;
  
  return permissions.some(permission => 
    user.pagePermissions && user.pagePermissions.includes(permission)
  );
};

// Check if user has all of the specified permissions
export const hasAllPermissions = (user: IUser | undefined, permissions: PagePermission[]): boolean => {
  if (!user) return false;
  if (['admin', 'super admin'].includes(user.role.toLowerCase())) return true;
  
  return permissions.every(permission => 
    user.pagePermissions && user.pagePermissions.includes(permission)
  );
};

// Legacy permission check for backward compatibility
export const requirePermission = requirePagePermission;
