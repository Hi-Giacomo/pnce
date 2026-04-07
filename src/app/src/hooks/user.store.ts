import { root } from ".";
import { proxy } from "./utils/proxy";

/**
 * 用户角色类型
 */
export type UserRole = 'admin' | 'developer' | 'viewer';

/**
 * 用户权限类型
 */
export type UserPermission = 
  | 'dashboard:view'
  | 'service:view' | 'service:create' | 'service:update' | 'service:delete' | 'service:control'
  | 'api:view' | 'api:create' | 'api:update' | 'api:delete'
  | 'user:view' | 'user:create' | 'user:update' | 'user:delete' | 'user:role-manage'
  | 'setting:view' | 'setting:update';

export const createUserStore = () => {
    const store = {
        name: "user",
        username: "",
        password: "",
        isLoggedIn: false,
        // 用户角色
        roles: [] as UserRole[],
        // 用户权限
        permissions: [] as UserPermission[],
        
        setName() {
            store.name = "user updated";
        },
        
        login(username: string, password: string) {
            // 模拟登录 - 默认设置为 admin 角色，拥有所有权限
            store.username = username;
            store.password = password;
            store.isLoggedIn = true;
            store.roles = ['admin'];
            store.permissions = [
                'dashboard:view',
                'service:view', 'service:create', 'service:update', 'service:delete', 'service:control',
                'api:view', 'api:create', 'api:update', 'api:delete',
                'user:view', 'user:create', 'user:update', 'user:delete', 'user:role-manage',
                'setting:view', 'setting:update'
            ];
            store.name = `欢迎 ${username}`;
        },
        
        logout() {
            store.username = "";
            store.password = "";
            store.isLoggedIn = false;
            store.roles = [];
            store.permissions = [];
            store.name = "user";
        },
        
        /**
         * 检查用户是否有指定角色
         */
        hasRole(role: UserRole): boolean {
            return store.roles.includes(role);
        },
        
        /**
         * 检查用户是否有指定权限
         */
        hasPermission(permission: UserPermission): boolean {
            // admin 角色拥有所有权限
            if (store.roles.includes('admin')) {
                return true;
            }
            return store.permissions.includes(permission);
        },
        
        /**
         * 检查用户是否有任一权限
         */
        hasAnyPermission(permissions: UserPermission[]): boolean {
            return permissions.some(p => store.hasPermission(p));
        },
        
        /**
         * 检查用户是否有所有权限
         */
        hasAllPermissions(permissions: UserPermission[]): boolean {
            return permissions.every(p => store.hasPermission(p));
        },
        
        callUI() {
            const ui = root.ui;
            ui.name = "called from user";
        }
    };

    return proxy(store) as typeof store;
};

export type UserStore = ReturnType<typeof createUserStore>;