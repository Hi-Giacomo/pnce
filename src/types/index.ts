export interface moduleInfo {
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
  totalmodules: number;
  totalVersions: number;
  totalSize: number;
  totalDownloads: number;
  topAuthors: Array<{ author: string; count: number }>;
  topmodules: Array<{ name: string; downloads: number }>;
}

export interface PackageJson {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: Record<string, string>;
  localmodules?: Record<string, string>;
  mainmodule?: string;
}

export interface moduleConfig {
  name: string;
  description: string;
  author: string;
  version: string;
  type: 'library' | 'microservice' | 'service';
  appId?: string;
  teamId?: string;
  mainmodule?: string;
  exports?: Record<string, string>;
  port?: number;
  installedmodules?: Record<string, string>; // RecordmoduleVersion
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

export interface loginOptions {
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
  modules?: moduleInfo[];
  module?: moduleInfo;
  stats?: Stats;
  user?: user info;
  access_token?: string;
  refresh_token?: string;
  [key: string]: unknown;
}

export interface user info {
  id?: string;
  username?: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: user info;
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
