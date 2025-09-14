// Frontend Permission Mapping
// This file helps map backend permissions to frontend menu items

export const FRONTEND_MENU_MAPPING = {
  // Backend permission -> Frontend menu text mapping
  'dashboard': 'แดชบอร์ด',
  'map': 'GPS รถบรรทุก',
  'track': 'GPS คอนเทนเนอร์', 
  'data-today': 'เพิ่มงานและออกรายงาน',
  'drivers': 'คนขับ',
  'vehicles': 'ทะเบียนหัว',
  'vehiclestail': 'ทะเบียนท้าย',
  'containers': 'ตู้คอนเทนเนอร์',
  'management': 'การจัดการผู้ใช้'
} as const;

// Route to permission mapping
export const ROUTE_PERMISSION_MAPPING = {
  '/dashboard': 'dashboard',
  '/': 'dashboard',
  '/gps-vehicles': 'map',
  '/map': 'map',
  '/gps-container': 'track',
  '/track': 'track',
  '/data-today': 'data-today',
  '/reports': 'data-today',
  '/drivers': 'drivers',
  '/vehicles': 'vehicles',
  '/vehicle-heads': 'vehicles',
  '/vehicle-tails': 'vehiclestail',
  '/containers': 'containers',
  '/users': 'management',
  '/user-management': 'management'
} as const;

// Menu icons mapping (if needed)
export const MENU_ICONS = {
  'dashboard': '🌐',
  'map': '🚛',
  'track': '📦',
  'data-today': '📋',
  'drivers': '👤',
  'vehicles': '🚚',
  'vehiclestail': '🚚',
  'containers': '📦',
  'management': '⚙️'
} as const;

// Helper function for frontend to check if user has permission for a route
export const hasRoutePermission = (userPermissions: string[], route: string): boolean => {
  const requiredPermission = ROUTE_PERMISSION_MAPPING[route as keyof typeof ROUTE_PERMISSION_MAPPING];
  if (!requiredPermission) return true; // Allow access if no specific permission required
  
  return userPermissions.includes(requiredPermission);
};

// Helper function to get menu label for a permission
export const getMenuLabel = (permission: string): string => {
  return FRONTEND_MENU_MAPPING[permission as keyof typeof FRONTEND_MENU_MAPPING] || permission;
};

// Generate menu items based on user permissions
export const generateMenuItems = (userPermissions: string[]) => {
  const availableMenus = [
    { permission: 'dashboard', route: '/dashboard', icon: '🌐' },
    { permission: 'map', route: '/gps-vehicles', icon: '🚛' },
    { permission: 'track', route: '/gps-container', icon: '📦' },
    { permission: 'data-today', route: '/data-today', icon: '📋' },
    { permission: 'drivers', route: '/drivers', icon: '👤' },
    { permission: 'vehicles', route: '/vehicles', icon: '🚚' },
    { permission: 'vehiclestail', route: '/vehicle-tails', icon: '🚚' },
    { permission: 'containers', route: '/containers', icon: '📦' },
    { permission: 'management', route: '/users', icon: '⚙️' }
  ];

  return availableMenus.filter(menu => 
    userPermissions.includes(menu.permission)
  ).map(menu => ({
    ...menu,
    label: getMenuLabel(menu.permission)
  }));
};

export default {
  FRONTEND_MENU_MAPPING,
  ROUTE_PERMISSION_MAPPING,
  MENU_ICONS,
  hasRoutePermission,
  getMenuLabel,
  generateMenuItems
};
