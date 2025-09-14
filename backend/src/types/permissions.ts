// types/permissions.ts
export const PAGE_PERMISSIONS = {
  DASHBOARD: 'dashboard',
  MAP: 'map', 
  TRACK_CONTAINER: 'track',
  DATA_TODAY: 'data-today',
  DRIVERS: 'drivers',
  VEHICLES: 'vehicles',
  VEHICLES_TAIL: 'vehiclestail',
  CONTAINERS: 'containers',
  USER_MANAGEMENT: 'management'
} as const;

// Type for page permissions
export type PagePermission = typeof PAGE_PERMISSIONS[keyof typeof PAGE_PERMISSIONS];

// Array of all permissions for validation
export const ALL_PERMISSIONS: PagePermission[] = Object.values(PAGE_PERMISSIONS);

// Type for user roles
export type UserRole = 'user' | 'manager' | 'admin' | 'super admin';

// Interface for permission-related API responses
export interface UserPermissionsResponse {
  success: boolean;
  data: {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
    pagePermissions: PagePermission[];
  };
}

export interface AvailablePermissionsResponse {
  success: boolean;
  data: {
    key: string;
    value: PagePermission;
    label: string;
    description: string;
  }[];
}

// Helper function to get default permissions based on role
export const getDefaultPermissions = (role?: UserRole | string): PagePermission[] => {
  switch (role?.toLowerCase()) {
    case 'super admin':
      return ALL_PERMISSIONS; // Super Admin can access everything including user management
    case 'admin':
      return ALL_PERMISSIONS; // Admin can access everything including user management
    case 'manager':
      return ALL_PERMISSIONS; // Manager can access everything including user management
    case 'user':
    default:
      return [PAGE_PERMISSIONS.MAP]; // User can only access GPS map (dashboard is accessible to everyone)
  }
};

// Helper function to get permission labels in Thai
export const getPermissionLabel = (permission: PagePermission): string => {
  const labels = {
    'dashboard': 'แดชบอร์ด',
    'map': 'GPS รถบรรทุก', 
    'track': 'GPS คอนเทนเนอร์',
    'data-today': 'เพิ่มงานและออกรายงาน',
    'drivers': 'คนขับ',
    'vehicles': 'ทะเบียนหัว',
    'vehiclestail': 'ทะเบียนท้าย',
    'containers': 'ตู้คอนเทนเนอร์',
    'management': 'การจัดการผู้ใช้'
  };
  return labels[permission] || permission;
};

// Helper function to get permission descriptions in Thai
export const getPermissionDescription = (permission: PagePermission): string => {
  const descriptions = {
    'dashboard': 'เข้าถึงหน้าแดชบอร์ดหลักของระบบ',
    'map': 'ดูแผนที่และติดตาม GPS รถบรรทุก',
    'track': 'ติดตามตำแหน่ง GPS คอนเทนเนอร์',
    'data-today': 'เพิ่มข้อมูลงานและสร้างรายงานประจำวัน',
    'drivers': 'จัดการข้อมูลคนขับรถ',
    'vehicles': 'จัดการข้อมูลทะเบียนหัวรถ',
    'vehiclestail': 'จัดการข้อมูลทะเบียนท้ายรถ',
    'containers': 'จัดการข้อมูลตู้คอนเทนเนอร์',
    'management': 'จัดการผู้ใช้และสิทธิ์การเข้าถึงระบบ'
  };
  return descriptions[permission] || '';
};

// Helper function to check if user can manage another user
export const canManageUser = (requestingUser: any, targetUser: any): boolean => {
  const requestingRole = requestingUser.role?.toLowerCase();
  const targetRole = targetUser.role?.toLowerCase();

  if (requestingRole === 'super admin') return true;
  if (requestingRole === 'admin' && targetRole !== 'super admin') return true;
  if (requestingRole === 'manager' && !['super admin', 'admin'].includes(targetRole)) return true;
  
  return false;
};
