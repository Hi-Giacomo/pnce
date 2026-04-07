import type { ApiResponse, PaginationParams, PaginatedResponse } from './types';
import type { UserInfo } from './auth.api';

/**
 * 用户状态类型
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/**
 * 用户角色
 */
export interface Role {
  /** 角色 ID */
  id: string;
  /** 角色名称 */
  name: string;
  /** 角色描述 */
  description?: string;
  /** 权限列表 */
  permissions: string[];
  /** 是否为系统角色 */
  isSystem: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 扩展用户信息（包含状态等）
 */
export interface UserDetail extends UserInfo {
  /** 用户状态 */
  status: UserStatus;
  /** 昵称 */
  nickname?: string;
  /** 性别 */
  gender?: 'male' | 'female' | 'other';
  /** 部门 */
  department?: string;
  /** 职位 */
  position?: string;
  /** 最后登录 IP */
  lastLoginIp?: string;
  /** 登录次数 */
  loginCount: number;
  /** 是否已验证邮箱 */
  emailVerified: boolean;
  /** 是否已验证手机 */
  phoneVerified: boolean;
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 邮箱 */
  email: string;
  /** 手机号 */
  phone?: string;
  /** 昵称 */
  nickname?: string;
  /** 角色 ID 列表 */
  roleIds: string[];
  /** 用户状态 */
  status?: UserStatus;
  /** 部门 */
  department?: string;
  /** 职位 */
  position?: string;
}

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 昵称 */
  nickname?: string;
  /** 头像 */
  avatar?: string;
  /** 角色 ID 列表 */
  roleIds?: string[];
  /** 用户状态 */
  status?: UserStatus;
  /** 部门 */
  department?: string;
  /** 职位 */
  position?: string;
}

/**
 * 用户查询参数
 */
export interface UserQueryParams extends PaginationParams {
  /** 用户状态过滤 */
  status?: UserStatus;
  /** 角色 ID 过滤 */
  roleId?: string;
  /** 部门过滤 */
  department?: string;
}

/**
 * 创建角色请求
 */
export interface CreateRoleRequest {
  /** 角色名称 */
  name: string;
  /** 角色描述 */
  description?: string;
  /** 权限列表 */
  permissions: string[];
}

/**
 * 更新角色请求
 */
export interface UpdateRoleRequest {
  /** 角色名称 */
  name?: string;
  /** 角色描述 */
  description?: string;
  /** 权限列表 */
  permissions?: string[];
}

/**
 * 权限信息
 */
export interface Permission {
  /** 权限 ID */
  id: string;
  /** 权限名称 */
  name: string;
  /** 权限描述 */
  description?: string;
  /** 权限模块 */
  module: string;
  /** 权限操作 */
  action: string;
  /** 是否为系统权限 */
  isSystem: boolean;
}

/**
 * 获取用户列表响应
 */
export type GetUsersResponse = ApiResponse<PaginatedResponse<UserDetail>>;

/**
 * 获取用户详情响应
 */
export type GetUserDetailResponse = ApiResponse<UserDetail>;

/**
 * 创建用户响应
 */
export type CreateUserResponse = ApiResponse<UserDetail>;

/**
 * 更新用户响应
 */
export type UpdateUserResponse = ApiResponse<UserDetail>;

/**
 * 删除用户响应
 */
export type DeleteUserResponse = ApiResponse<{ success: boolean; message: string }>;

/**
 * 禁用/启用用户响应
 */
export type ToggleUserStatusResponse = ApiResponse<UserDetail>;

/**
 * 重置用户密码响应
 */
export type ResetUserPasswordResponse = ApiResponse<{ success: boolean; message: string }>;

/**
 * 获取角色列表响应
 */
export type GetRolesResponse = ApiResponse<Role[]>;

/**
 * 创建角色响应
 */
export type CreateRoleResponse = ApiResponse<Role>;

/**
 * 更新角色响应
 */
export type UpdateRoleResponse = ApiResponse<Role>;

/**
 * 删除角色响应
 */
export type DeleteRoleResponse = ApiResponse<{ success: boolean; message: string }>;

/**
 * 获取权限列表响应
 */
export type GetPermissionsResponse = ApiResponse<Permission[]>;
