/**
 * API 响应基础类型
 */
export interface ApiResponse<T = unknown> {
  /** 状态码 */
  code: number;
  /** 消息 */
  message: string;
  /** 数据 */
  data: T;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  /** 页码，从 1 开始 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 搜索关键词 */
  keyword?: string;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应数据
 */
export interface PaginatedResponse<T> {
  /** 数据列表 */
  list: T[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 通用 ID 类型
 */
export type IdType = string | number;
