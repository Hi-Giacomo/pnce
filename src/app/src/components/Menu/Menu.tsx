import React from 'react';
import './index.scss';

export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
}

interface MenuProps {
  items: MenuItem[];
  selectedKeys?: string[];
  onSelect?: (key: string) => void;
  onExpandToggle?: () => void; // 用于通知父组件展开侧边栏
  isCollapsed?: boolean; // 侧边栏是否收起
  mode?: 'vertical' | 'horizontal';
  className?: string;
}

export function Menu({
  items,
  selectedKeys = [],
  onSelect,
  onExpandToggle,
  isCollapsed = false,
  mode = 'vertical',
  className = '',
}: MenuProps) {
  const [expandedKeys, setExpandedKeys] = React.useState<string[]>([]);

  const toggleExpand = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const renderItems = (items: MenuItem[], level = 0) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedKeys.includes(item.key);
      const isSelected = selectedKeys.includes(item.key);

      return (
        <div key={item.key}>
          <div
            className={`menu-item ${isSelected ? 'active' : ''} ${hasChildren ? 'has-children' : ''} ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
              if (hasChildren) {
                if (isCollapsed) {
                  // 收起状态下，点击有子菜单的项时先展开侧边栏
                  onExpandToggle?.();
                } else {
                  toggleExpand(item.key, e);
                }
              } else {
                onSelect?.(item.key);
              }
            }}
            title={item.label}
            style={{ paddingLeft: `${level * 16 + 16}px` }}
          >
            {item.icon && <span className="menu-icon">{item.icon}</span>}
            <span className="menu-label">{item.label}</span>
            {hasChildren && (
              <span className="menu-arrow">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points={isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                </svg>
              </span>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="menu-submenu">{renderItems(item.children!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return <div className={`menu menu-${mode} ${className}`}>{renderItems(items)}</div>;
}
