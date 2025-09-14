import express from 'express';
import { verifyToken } from '../Middleware/authMiddleware';
import { requirePagePermission, requireRole } from '../Middleware/pagePermissions';
import { PermissionController } from '../controllers/permissionController';
import { PAGE_PERMISSIONS } from '../types/permissions';

const router = express.Router();

// Apply validation middleware
router.get('/users/:id/permissions', 
  PermissionController.validateUserId,
  verifyToken, 
  requireRole(['admin', 'super admin', 'manager']), 
  PermissionController.getUserPermissions
);

router.put('/users/:id/permissions', 
  PermissionController.validateUserId,
  PermissionController.validatePermissions,
  verifyToken, 
  requirePagePermission(PAGE_PERMISSIONS.USER_MANAGEMENT), 
  PermissionController.updateUserPermissions
);

router.get('/permissions/available', 
  verifyToken, 
  requireRole(['admin', 'super admin', 'manager']), 
  PermissionController.getAvailablePermissions
);

// Get current user's permissions
router.get('/permissions/me', 
  verifyToken, 
  PermissionController.getCurrentUserPermissions
);

// Get menu configuration for frontend
router.get('/menu/config', 
  verifyToken, 
  PermissionController.getMenuConfig
);

export default router;
