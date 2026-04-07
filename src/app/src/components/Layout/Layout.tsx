import React from 'react';
import './index.scss';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className = '' }: LayoutProps) {
  return <div className={`layout ${className}`}>{children}</div>;
}

interface SiderProps {
  children: React.ReactNode;
  width?: number | string;
  collapsedWidth?: number | string;
  collapsed?: boolean;
  className?: string;
}

export function Sider({
  children,
  width = 200,
  collapsedWidth = 80,
  collapsed = false,
  className = '',
}: SiderProps) {
  const currentWidth = collapsed ? collapsedWidth : width;

  return (
    <div
      className={`layout-sider ${className} ${collapsed ? 'collapsed' : ''}`}
      style={{ width: currentWidth }}
    >
      {children}
    </div>
  );
}

interface ContentProps {
  children: React.ReactNode;
  className?: string;
}

export function Content({ children, className = '' }: ContentProps) {
  return <div className={`layout-content ${className}`}>{children}</div>;
}

interface HeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function Header({ children, className = '' }: HeaderProps) {
  return <div className={`layout-header ${className}`}>{children}</div>;
}
