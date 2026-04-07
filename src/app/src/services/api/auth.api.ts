import type { ApiResponse } from './types';

/**
 * 登录请求参数
 */
export interface LoginRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 记住我 */
  rememberMe?: boolean;
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 令牌类型 */
  tokenType: string;
  /** 过期时间（秒） */
  expiresIn: number;
  /** 用户信息 */
  user: UserInfo;
}

/**
 * 用户信息
 */
export interface UserInfo {
  /** 用户 ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 手机号 */
  phone?: string;
  /** 头像 */
  avatar?: string;
  /** 角色列表 */
  roles: string[];
  /** 权限列表 */
  permissions: string[];
  /** 创建时间 */
  createdAt: string;
  /** 最后登录时间 */
  lastLoginAt?: string;
}

/**
 * 刷新令牌请求
 */
export interface RefreshTokenRequest {
  /** 刷新令牌 */
  refreshToken: string;
}

/**
 * 刷新令牌响应
 */
export interface RefreshTokenResponse {
  /** 新的访问令牌 */
  accessToken: string;
  /** 新的刷新令牌 */
  refreshToken: string;
  /** 过期时间（秒） */
  expiresIn: number;
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  /** 旧密码 */
  oldPassword: string;
  /** 新密码 */
  newPassword: string;
  /** 确认新密码 */
  confirmPassword: string;
}

/**
 * 登出响应
 */
export interface LogoutResponse {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
}

/**
 * 获取当前用户信息响应
 */
export type GetCurrentUserInfoResponse = ApiResponse<UserInfo>;

/**
 * 登录响应类型
 */
export type LoginApiResponse = ApiResponse<LoginResponse>;

/**
 * 刷新令牌响应类型
 */
export type RefreshTokenApiResponse = ApiResponse<RefreshTokenResponse>;

/**
 * 修改密码响应类型
 */
export type ChangePasswordApiResponse = ApiResponse<LogoutResponse>;

/**
 * 登出响应类型
 */
export type LogoutApiResponse = ApiResponse<LogoutResponse>;
