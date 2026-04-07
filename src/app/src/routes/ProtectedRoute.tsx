import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { root } from '../hooks';
import type { UserPermission } from '../hooks/user.store';
import { canAccessRoute } from './permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

/**
 * 受保护的路由组件
 * 检查用户登录状态和权限
 */
export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const location = useLocation();
  const user = root.user;

  // 检查是否登录
  if (!user.isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查权限
  if (requiredPermission && !user.hasPermission(requiredPermission as UserPermission)) {
    // 没有权限，重定向到无权限页面或首页
    return <Navigate to="/manager/dashboard" replace />;
  }

  // 检查当前路由的权限配置
  const currentPath = location.pathname;
  if (!canAccessRoute(currentPath, user.hasPermission.bind(user), user.hasRole.bind(user))) {
    return <Navigate to="/manager/dashboard" replace />;
  }

  return <>{children}</>;
}
