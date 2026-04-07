import type { UserPermission } from '../hooks/user.store';

/**
 * 路由权限配置
 */
export interface RoutePermissionConfig {
  /** 路由路径 */
  path: string;
  /** 所需权限 */
  permissions: UserPermission[];
  /** 是否需要所有权限（true=所有，false=任一） */
  requireAll?: boolean;
  /** 允许的角色 */
  roles?: Array<'admin' | 'developer' | 'viewer'>;
}

/**
 * 路由权限映射表
 * 定义每个路由路径所需的权限
 */
export const ROUTE_PERMISSIONS: Record<string, RoutePermissionConfig> = {
  // 仪表盘
  '/manager/dashboard': {
    path: '/manager/dashboard',
    permissions: ['dashboard:view'],
  },
  
  // 服务管理
  '/manager/services': {
    path: '/manager/services',
    permissions: ['service:view'],
  },
  
  // API 管理
  '/manager/apis': {
    path: '/manager/apis',
    permissions: ['api:view'],
  },
  
  // 用户管理
  '/manager/users': {
    path: '/manager/users',
    permissions: ['user:view'],
  },
  
  // 系统设置
  '/manager/settings': {
    path: '/manager/settings',
    permissions: ['setting:view'],
  },
};

/**
 * 菜单项权限配置
 * 控制菜单项的显示
 */
export const MENU_PERMISSIONS: Record<string, UserPermission[]> = {
  'dashboard': ['dashboard:view'],
  'services': ['service:view'],
  'apis': ['api:view'],
  'users': ['user:view'],
  'settings': ['setting:view'],
};

/**
 * 检查路由是否可访问
 * @param path 路由路径
 * @param hasPermission 权限检查函数
 * @param hasRole 角色检查函数
 * @returns 是否可访问
 */
export function canAccessRoute(
  path: string,
  hasPermission: (permission: UserPermission) => boolean,
  hasRole?: (role: 'admin' | 'developer' | 'viewer') => boolean
): boolean {
  const config = ROUTE_PERMISSIONS[path];
  
  if (!config) {
    // 没有配置权限要求的路由，默认允许访问
    return true;
  }
  
  // 检查角色权限
  if (config.roles && hasRole) {
    const hasRequiredRole = config.roles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return false;
    }
  }
  
  // 检查操作权限
  if (config.requireAll) {
    // 需要所有权限
    return config.permissions.every(p => hasPermission(p));
  } else {
    // 只需要任一权限
    return config.permissions.some(p => hasPermission(p));
  }
}

/**
 * 检查菜单项是否应该显示
 * @param menuKey 菜单项 key
 * @param hasPermission 权限检查函数
 * @returns 是否应该显示
 */
export function shouldShowMenuItem(
  menuKey: string,
  hasPermission: (permission: UserPermission) => boolean
): boolean {
  const requiredPermissions = MENU_PERMISSIONS[menuKey];
  
  if (!requiredPermissions || requiredPermissions.length === 0) {
    // 没有配置权限要求的菜单项，默认显示
    return true;
  }
  
  // 只需要任一权限即可显示
  return requiredPermissions.some(p => hasPermission(p));
}
