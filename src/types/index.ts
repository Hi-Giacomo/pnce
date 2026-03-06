export interface Config {
  registry: string;
  website: string;
  authToken: string;
}

export interface ModuleInfo {
  name: string;
  description: string;
  author: string;
  latest: string;
  versions: Record<string, VersionInfo> | string[];
  createdAt: string;
  uploadedBy?: string;
  type?: string;
  appId?: string;
  teamId?: string;
  downloads?: number;
}

export interface VersionInfo {
  version: string;
  uploadedAt: string;
  size: number;
}

export interface Stats {
  totalModules: number;
  totalVersions: number;
  totalSize: number;
  totalDownloads: number;
  topAuthors: Array<{ author: string; count: number }>;
  topModules: Array<{ name: string; downloads: number }>;
}

export interface PackageJson {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: Record<string, string>;
  localModules?: Record<string, string>;
  mainModule?: string;
}

export interface ModuleConfig {
  name: string;
  description: string;
  author: string;
  version: string;
  type: 'library' | 'microservice' | 'service';
  appId?: string;
  teamId?: string;
  mainModule?: string;
  exports?: Record<string, string>;
  port?: number;
  installedModules?: Record<string, string>; // 记录安装的模块及其版本
}

export interface UploadOptions {
  directory: string;
  name?: string;
  version?: string;
  description?: string;
  author?: string;
}

export interface InstallOptions {
  version?: string;
  directory: string;
}

export interface SearchOptions {
  query: string;
}

export interface LoginOptions {
  email?: string;
  password?: string;
}

export interface RegisterOptions {
  username?: string;
  email?: string;
  password?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  modules?: ModuleInfo[];
  module?: ModuleInfo;
  stats?: Stats;
  user?: UserInfo;
  access_token?: string;
  refresh_token?: string;
  [key: string]: unknown;
}

export interface UserInfo {
  id?: string;
  username?: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: UserInfo;
}

export interface OAuth2AuthorizeOptions {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256' | 'plain';
  scope?: string;
  state: string;
}

export interface OAuth2TokenRequest {
  clientId: string;
  clientSecret?: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  grantType: 'authorization_code';
}
