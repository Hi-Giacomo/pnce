import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router';
import { Layout, Sider, Content, Header, Menu, type MenuItem } from '../../../../components';
import { root, notify } from '../../../../hooks';
import { shouldShowMenuItem } from '../../../../routes/permissions';
import { mockApi } from '../../../../services/mock/mock-api';
import './index.scss';

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: 'services',
    label: '服务管理',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="2" y="2" width="20" height="8" rx="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    children: [
      { key: 'service-list', label: '服务列表' },
      { key: 'service-monitor', label: '服务监控' },
      { key: 'service-config', label: '服务配置' },
    ],
  },
  {
    key: 'apis',
    label: 'API 管理',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    children: [
      { key: 'api-list', label: 'API 列表' },
      { key: 'api-docs', label: 'API 文档' },
      { key: 'api-test', label: 'API 测试' },
    ],
  },
  {
    key: 'users',
    label: '用户管理',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    children: [
      { key: 'user-list', label: '用户列表' },
      { key: 'role-manage', label: '角色管理' },
      { key: 'permission', label: '权限设置' },
    ],
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    children: [
      { key: 'system-config', label: '系统配置' },
      { key: 'log-manage', label: '日志管理' },
      { key: 'backup', label: '数据备份' },
    ],
  },
];

export function ManagerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = root.user;

  // 根据权限过滤菜单项
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => shouldShowMenuItem(item.key, user.hasPermission.bind(user)));
  }, [user]);

  // 从当前路径提取选中的菜单项
  const pathSegments = location.pathname.split('/');
  const currentKey = pathSegments[pathSegments.length - 1] || 'dashboard';

  const handleMenuSelect = (key: string) => {
    navigate(`/manager/${key}`);
  };

  // 全屏切换功能
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error('全屏失败:', err);
        });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // 退出登录
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setShowUserMenu(false);
    setIsLoggingOut(true);
    
    try {
      // 调用 Mock API 登出
      await mockApi.auth.logout();
      
      // 清除用户状态
      root.user.logout();
      notify();
      
      // 跳转到登录页
      navigate('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
      // 即使失败也清除本地状态
      root.user.logout();
      notify();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 切换用户菜单
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <Layout className="manager-layout">
      {/* 底部扫描线容器 */}
      <div className="scan-bottom"></div>
      {/* 左侧扫描线容器 */}
      <div className="scan-left"></div>

      <Sider
        width={220}
        collapsedWidth={64}
        collapsed={collapsed}
        className={`layout-sider ${collapsed ? 'collapsed' : ''}`}
      >
        <div className="manager-logo">
          <span>PNCE</span>
        </div>
        <Menu
          items={filteredMenuItems}
          selectedKeys={[currentKey]}
          onSelect={handleMenuSelect}
          onExpandToggle={() => setCollapsed(false)}
          isCollapsed={collapsed}
        />
        <div className="sider-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            {collapsed ? (
              <path
                d="M6 4L10 8L6 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M10 4L6 8L10 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </Sider>
      <div className="manager-main">
        <Header>
          <div className="header-left">
            <h2>{menuItems.find((m) => m.key === currentKey)?.label}</h2>
          </div>
          <div className="header-right">
            <button
              className="fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? '退出全屏' : '全屏'}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {isFullscreen ? (
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                ) : (
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                )}
              </svg>
            </button>
            
            {/* 用户菜单容器 */}
            <div className="user-menu-container">
              <button
                className="user-menu-trigger"
                onClick={toggleUserMenu}
                title="用户菜单"
              >
                <span className="user-name">{user.username || '管理员'}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`user-menu-arrow ${showUserMenu ? 'rotated' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              
              {/* 下拉菜单 */}
              {showUserMenu && (
                <div className="user-dropdown-menu">
                  <div className="menu-header">
                    <div className="user-info">
                      <div className="user-avatar">
                        {(user.username || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-username">{user.username || '管理员'}</div>
                        <div className="user-role">{user.roles.length > 0 ? user.roles[0] : '用户'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="menu-divider"></div>
                  
                  <button
                    className="menu-item logout-item"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>{isLoggingOut ? '退出中...' : '退出登录'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </Header>
        <Content>
          <Outlet />
        </Content>
      </div>
    </Layout>
  );
}
