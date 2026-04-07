/* eslint-disable react-refresh/only-export-components */
/**
 * 权限控制使用示例
 * 
 * 本文件展示如何在不同场景下使用权限控制系统
 * 注意: 此文件仅用于示例和参考,不用于实际渲染
 */

import { root } from '../hooks';
import type { UserPermission } from '../hooks/user.store';

// ============================================
// 示例 1: 在组件中检查权限
// ============================================

export function PermissionExample1() {
  const user = root.user;

  // 检查单个权限
  const canViewServices = user.hasPermission('service:view');
  
  // 检查角色
  const isAdmin = user.hasRole('admin');
  
  // 根据权限显示不同内容
  return (
    <div>
      {canViewServices ? (
        <button>查看服务</button>
      ) : (
        <span>无权限查看服务</span>
      )}
      
      {isAdmin && <button className="admin-btn">管理员操作</button>}
    </div>
  );
}

// ============================================
// 示例 2: 条件渲染按钮
// ============================================

export function ServiceActions() {
  const user = root.user;
  
  return (
    <div className="service-actions">
      {/* 查看按钮 - 需要 service:view 权限 */}
      {user.hasPermission('service:view') && (
        <button>查看详情</button>
      )}
      
      {/* 编辑按钮 - 需要 service:update 权限 */}
      {user.hasPermission('service:update') && (
        <button>编辑</button>
      )}
      
      {/* 删除按钮 - 需要 service:delete 权限 */}
      {user.hasPermission('service:delete') && (
        <button className="danger">删除</button>
      )}
      
      {/* 控制按钮 - 需要 service:control 权限 */}
      {user.hasPermission('service:control') && (
        <div>
          <button>启动</button>
          <button>停止</button>
        </div>
      )}
    </div>
  );
}

// ============================================
// 示例 3: 检查多个权限
// ============================================

export function AdvancedServiceManagement() {
  const user = root.user;
  
  // 检查是否有任一权限
  const canManageServices = user.hasAnyPermission([
    'service:create',
    'service:update',
    'service:delete'
  ]);
  
  // 检查是否有所有权限
  const isFullServiceAdmin = user.hasAllPermissions([
    'service:view',
    'service:create',
    'service:update',
    'service:delete',
    'service:control'
  ]);
  
  return (
    <div>
      {canManageServices && <p>您可以管理服务</p>}
      {isFullServiceAdmin && <p>您是服务管理员</p>}
    </div>
  );
}

// ============================================
// 示例 4: 自定义 Hook
// ============================================

/**
 * 使用权限的自定义 Hook
 */
export function usePermission(permission: UserPermission) {
  const user = root.user;
  return {
    hasPermission: user.hasPermission(permission),
    hasRole: user.hasRole.bind(user),
    user,
  };
}

// 使用示例
export function ServiceListPage() {
  const { hasPermission: canView } = usePermission('service:view');
  const { hasPermission: canCreate } = usePermission('service:create');
  
  if (!canView) {
    return <div>无权限访问</div>;
  }
  
  return (
    <div>
      <h1>服务列表</h1>
      {canCreate && <button>创建服务</button>}
      {/* 服务列表内容 */}
    </div>
  );
}

// ============================================
// 示例 5: 模拟不同角色登录（用于测试）
// ============================================

export function testDifferentRoles() {
  const user = root.user;
  
  // 模拟 Admin 登录
  console.log('=== Admin Role ===');
  user.login('admin', 'password');
  console.log('Roles:', user.roles);
  console.log('Has service:view:', user.hasPermission('service:view'));
  console.log('Has user:delete:', user.hasPermission('user:delete'));
  console.log('Is admin:', user.hasRole('admin'));
  
  // 模拟 Developer 登录（需要修改 login 方法支持角色参数）
  // user.login('developer', 'password', 'developer');
  console.log('\n=== Developer Role ===');
  // console.log('Has service:view:', user.hasPermission('service:view'));
  // console.log('Has user:delete:', user.hasPermission('user:delete'));
  
  // 模拟 Viewer 登录
  // user.login('viewer', 'password', 'viewer');
  console.log('\n=== Viewer Role ===');
  // console.log('Has dashboard:view:', user.hasPermission('dashboard:view'));
  // console.log('Has service:create:', user.hasPermission('service:create'));
}

// ============================================
// 示例 6: 动态菜单项
// ============================================

interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  permission?: UserPermission;
}

export function getAuthorizedMenuItems(): MenuItem[] {
  const user = root.user;
  
  const allMenuItems: MenuItem[] = [
    {
      key: 'dashboard',
      label: '仪表盘',
      permission: 'dashboard:view',
    },
    {
      key: 'services',
      label: '服务管理',
      permission: 'service:view',
    },
    {
      key: 'apis',
      label: 'API 管理',
      permission: 'api:view',
    },
    {
      key: 'users',
      label: '用户管理',
      permission: 'user:view',
    },
    {
      key: 'settings',
      label: '系统设置',
      permission: 'setting:view',
    },
  ];
  
  // 过滤出有权限的菜单项
  return allMenuItems.filter(item => {
    if (!item.permission) return true;
    return user.hasPermission(item.permission);
  });
}

// ============================================
// 示例 7: 页面级别的权限保护
// ============================================

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const user = root.user;
  
  // 检查是否登录
  if (!user.isLoggedIn) {
    return <div>请先登录</div>;
  }
  
  // 检查特定权限
  if (!user.hasPermission('setting:view')) {
    return <div>无权限访问此页面</div>;
  }
  
  return <>{children}</>;
}

// ============================================
// 示例 8: 批量权限检查
// ============================================

export function PermissionMatrix() {
  const user = root.user;
  
  const permissions: UserPermission[] = [
    'dashboard:view',
    'service:view',
    'service:create',
    'api:view',
    'user:view',
    'setting:view',
  ];
  
  return (
    <table>
      <thead>
        <tr>
          <th>权限</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        {permissions.map(perm => (
          <tr key={perm}>
            <td>{perm}</td>
            <td>
              {user.hasPermission(perm) ? (
                <span style={{ color: 'green' }}>✓ 已授权</span>
              ) : (
                <span style={{ color: 'red' }}>✗ 未授权</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ============================================
// 示例 9: 权限变更监听（如果需要）
// ============================================

export function watchPermissionChanges() {
  const user = root.user;
  
  // 保存初始权限状态
  const initialPermissions = [...user.permissions];
  
  // 定期检查权限变化（实际项目中可能不需要）
  const interval = setInterval(() => {
    if (JSON.stringify(initialPermissions) !== JSON.stringify(user.permissions)) {
      console.log('权限已变更');
      console.log('新权限:', user.permissions);
      clearInterval(interval);
    }
  }, 1000);
  
  return () => clearInterval(interval);
}

// ============================================
// 示例 10: 导出权限工具函数
// ============================================

/**
 * 获取用户的所有权限描述
 */
export function getUserPermissionDescriptions(): string[] {
  const user = root.user;
  const descriptions: Record<UserPermission, string> = {
    'dashboard:view': '查看仪表盘',
    'service:view': '查看服务',
    'service:create': '创建服务',
    'service:update': '更新服务',
    'service:delete': '删除服务',
    'service:control': '控制服务',
    'api:view': '查看 API',
    'api:create': '创建 API',
    'api:update': '更新 API',
    'api:delete': '删除 API',
    'user:view': '查看用户',
    'user:create': '创建用户',
    'user:update': '更新用户',
    'user:delete': '删除用户',
    'user:role-manage': '管理角色',
    'setting:view': '查看设置',
    'setting:update': '更新设置',
  };
  
  return user.permissions.map(perm => descriptions[perm]);
}

/**
 * 检查用户是否可以执行某个操作
 */
export function canPerformAction(
  module: 'service' | 'api' | 'user' | 'setting',
  action: 'view' | 'create' | 'update' | 'delete' | 'control' | 'role-manage'
): boolean {
  const user = root.user;
  const permission: UserPermission = `${module}:${action}` as UserPermission;
  return user.hasPermission(permission);
}

// 使用示例
export function ActionButtons() {
  return (
    <div>
      {canPerformAction('service', 'create') && <button>创建服务</button>}
      {canPerformAction('api', 'delete') && <button>删除 API</button>}
      {canPerformAction('user', 'role-manage') && <button>管理角色</button>}
    </div>
  );
}
