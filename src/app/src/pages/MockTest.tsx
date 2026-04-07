/**
 * Mock 数据测试页面
 * 
 * 用于演示和测试 Mock API 的功能
 */

import { useState, useEffect } from 'react';
import { Card, Button } from '../components';
import { mockApi } from '../services/mock/mock-api';
import type { UserInfo, ServiceInfo, DashboardStats, RecentActivity } from '../services/api';

export default function MockTestPage() {
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载所有 Mock 数据
  const loadAllData = async () => {
    setLoading(true);
    
    try {
      // 获取当前用户
      const userRes = await mockApi.auth.getCurrentUser();
      if (userRes.code === 200) {
        setCurrentUser(userRes.data);
      }

      // 获取服务列表
      const servicesRes = await mockApi.service.getServices(1, 10);
      if (servicesRes.code === 200) {
        setServices(servicesRes.data.list);
      }

      // 获取统计数据
      const statsRes = await mockApi.dashboard.getStats();
      if (statsRes.code === 200) {
        setStats(statsRes.data);
      }

      // 获取最近活动
      const activitiesRes = await mockApi.dashboard.getRecentActivities(10);
      if (activitiesRes.code === 200) {
        setActivities(activitiesRes.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 测试登录
  const testLogin = async (username: string) => {
    setLoading(true);
    
    try {
      const result = await mockApi.auth.login({
        username,
        password: '123456',
      });
      
      alert(`登录${result.code === 200 ? '成功' : '失败'}: ${result.message}`);
      
      if (result.code === 200) {
        setCurrentUser(result.data.user);
      }
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 测试服务操作
  const testServiceControl = async (serviceId: string, action: 'start' | 'stop') => {
    setLoading(true);
    
    try {
      const result = action === 'start' 
        ? await mockApi.service.startService(serviceId)
        : await mockApi.service.stopService(serviceId);
      
      alert(`${action === 'start' ? '启动' : '停止'}${result.code === 200 ? '成功' : '失败'}`);
      
      // 重新加载服务列表
      const servicesRes = await mockApi.service.getServices(1, 10);
      if (servicesRes.code === 200) {
        setServices(servicesRes.data.list);
      }
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Mock 数据测试">
        <div style={{ marginBottom: '24px' }}>
          <h3>快速操作</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button onClick={() => testLogin('admin')} loading={loading}>
              测试 Admin 登录
            </Button>
            <Button onClick={() => testLogin('developer')} loading={loading}>
              测试 Developer 登录
            </Button>
            <Button onClick={() => testLogin('viewer')} loading={loading}>
              测试 Viewer 登录
            </Button>
            <Button onClick={loadAllData} loading={loading}>
              刷新所有数据
            </Button>
          </div>
        </div>

        {currentUser && (
          <div style={{ marginBottom: '24px' }}>
            <h3>当前用户</h3>
            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
              <p><strong>用户名:</strong> {currentUser.username}</p>
              <p><strong>邮箱:</strong> {currentUser.email}</p>
              <p><strong>角色:</strong> {currentUser.roles.join(', ')}</p>
              <p><strong>权限数量:</strong> {currentUser.permissions.length}</p>
            </div>
          </div>
        )}

        {stats && (
          <div style={{ marginBottom: '24px' }}>
            <h3>统计数据</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#e6f7ff', padding: '16px', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.services.total}</p>
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>总服务数</p>
              </div>
              <div style={{ background: '#f6ffed', padding: '16px', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.services.running}</p>
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>运行中</p>
              </div>
              <div style={{ background: '#fff7e6', padding: '16px', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.activeUsers.toLocaleString()}</p>
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>活跃用户</p>
              </div>
              <div style={{ background: '#fff1f0', padding: '16px', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.apiCalls.totalCalls.toLocaleString()}</p>
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>API 调用</p>
              </div>
            </div>
          </div>
        )}

        {services.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3>服务列表</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {services.map(service => (
                <div 
                  key={service.id}
                  style={{ 
                    background: '#fafafa', 
                    padding: '16px', 
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{service.name}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
                      端口: {service.port} | 状态: {service.status}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {service.status !== 'running' && (
                      <Button 
                        onClick={() => testServiceControl(service.id, 'start')}
                        loading={loading}
                      >
                        启动
                      </Button>
                    )}
                    {service.status === 'running' && (
                      <Button 
                        variant="default"
                        onClick={() => testServiceControl(service.id, 'stop')}
                        loading={loading}
                      >
                        停止
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activities.length > 0 && (
          <div>
            <h3>最近活动</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {activities.map(activity => (
                <div 
                  key={activity.id}
                  style={{ 
                    background: '#fafafa', 
                    padding: '12px', 
                    borderRadius: '4px',
                    borderLeft: `4px solid ${
                      activity.status === 'success' ? '#52c41a' :
                      activity.status === 'error' ? '#ff4d4f' : '#faad14'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold' }}>{activity.action}</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>{activity.time}</span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                    {activity.target} - {activity.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
