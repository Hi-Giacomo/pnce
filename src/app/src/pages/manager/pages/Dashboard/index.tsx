import { Card, Table, Chart, Button } from '../../../../components';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { useState, useEffect } from 'react';
import type { RecentActivity, DashboardStats } from '../../../../services/api';
import { mockApi } from '../../../../services/mock/mock-api';
import './index.scss';

// 统计数据
const statsData = [
  {
    title: '总服务数',
    value: '24',
    trend: '+12%',
    trendType: 'up',
    icon: (
      <svg
        width="24"
        height="24"
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
  },
  {
    title: '运行中',
    value: '18',
    trend: '+5%',
    trendType: 'up',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    title: 'API 调用',
    value: '128K',
    trend: '+23%',
    trendType: 'up',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: '活跃用户',
    value: '2,845',
    trend: '-3%',
    trendType: 'down',
    icon: (
      <svg
        width="24"
        height="24"
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
  },
];

// 最近活动数据
const recentActivities = [
  { key: '1', time: '2分钟前', action: '服务重启', target: '用户服务', status: 'success' },
  { key: '2', time: '15分钟前', action: '配置更新', target: '支付服务', status: 'success' },
  { key: '3', time: '1小时前', action: '部署失败', target: '订单服务', status: 'error' },
  { key: '4', time: '2小时前', action: 'API 创建', target: '/api/v2/users', status: 'success' },
  { key: '5', time: '3小时前', action: '权限修改', target: '管理员角色', status: 'warning' },
];

const activityColumns = [
  { title: '时间', dataIndex: 'time', key: 'time', width: 120 },
  { title: '操作', dataIndex: 'action', key: 'action' },
  { title: '目标', dataIndex: 'target', key: 'target' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (value: unknown) => {
      const status = value as string;
      return (
        <span className={`activity-status ${status}`}>
          {status === 'success' ? '成功' : status === 'error' ? '失败' : '警告'}
        </span>
      );
    },
  },
];

// 服务列表数据
interface ServiceItem {
  id: string;
  name: string;
  port: number;
  status: 'running' | 'stopped' | 'error';
  cpu: number;
  memory: number;
}

const initialServices: ServiceItem[] = [
  { id: '1', name: '用户服务', port: 3001, status: 'running', cpu: 45, memory: 128 },
  { id: '2', name: '订单服务', port: 3002, status: 'running', cpu: 62, memory: 256 },
  { id: '3', name: '支付服务', port: 3003, status: 'stopped', cpu: 0, memory: 0 },
  { id: '4', name: '消息服务', port: 3004, status: 'running', cpu: 28, memory: 96 },
  { id: '5', name: '文件服务', port: 3005, status: 'error', cpu: 0, memory: 0 },
];

// 服务监控趋势图表配置
const serviceTrendOption: EChartsOption = {
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    textStyle: {
      color: '#fff',
    },
  },
  legend: {
    data: ['CPU 使用率', '内存使用率', '请求量'],
    textStyle: {
      color: 'rgba(255, 255, 255, 0.65)',
    },
    bottom: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    top: '10%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    axisLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
    },
    axisLabel: {
      color: 'rgba(255, 255, 255, 0.45)',
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
    },
    axisLabel: {
      color: 'rgba(255, 255, 255, 0.45)',
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.05)',
      },
    },
  },
  series: [
    {
      name: 'CPU 使用率',
      type: 'line',
      smooth: true,
      data: [30, 35, 45, 60, 55, 70, 65],
      itemStyle: {
        color: '#6366f1',
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
          { offset: 1, color: 'rgba(99, 102, 241, 0.05)' },
        ]),
      },
    },
    {
      name: '内存使用率',
      type: 'line',
      smooth: true,
      data: [45, 50, 55, 65, 60, 75, 70],
      itemStyle: {
        color: '#8b5cf6',
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
          { offset: 1, color: 'rgba(139, 92, 246, 0.05)' },
        ]),
      },
    },
    {
      name: '请求量',
      type: 'line',
      smooth: true,
      data: [1200, 1500, 2800, 4200, 3800, 5200, 4800],
      itemStyle: {
        color: '#10b981',
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
          { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
        ]),
      },
    },
  ],
};

export default function Dashboard() {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [, setActivities] = useState<RecentActivity[]>([]);
  const [, setStats] = useState<DashboardStats | null>(null);

  // 加载仪表板数据
  useEffect(() => {
    // 加载统计数据
    mockApi.dashboard.getStats().then(res => {
      if (res.code === 200) {
        setStats(res.data);
      }
    });

    // 加载最近活动
    mockApi.dashboard.getRecentActivities(10).then(res => {
      if (res.code === 200) {
        setActivities(res.data);
      }
    });
  }, []);

  // 切换服务状态
  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.map((service) => {
        if (service.id === id) {
          const newStatus = service.status === 'running' ? 'stopped' : 'running';
          return {
            ...service,
            status: newStatus,
            cpu: newStatus === 'running' ? Math.floor(Math.random() * 50) + 20 : 0,
            memory: newStatus === 'running' ? Math.floor(Math.random() * 200) + 100 : 0,
          };
        }
        return service;
      })
    );
  };

  // 获取状态文本
  const getStatusText = (status: ServiceItem['status']) => {
    switch (status) {
      case 'running':
        return '运行中';
      case 'stopped':
        return '已停止';
      case 'error':
        return '错误';
    }
  };

  return (
    <div className="page-container dashboard-page">
      {/* 统计卡片 */}
      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <Card key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-title">{stat.title}</div>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-trend ${stat.trendType}`}>
                {stat.trendType === 'up' ? '↑' : '↓'} {stat.trend}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="charts-section">
        <Card title="服务监控趋势">
          <Chart option={serviceTrendOption} height={350} />
        </Card>
      </div>

      {/* 服务快捷控制 */}
      <Card title="服务快捷控制" className="service-control-card">
        <div className="service-list">
          {services.map((service) => (
            <div key={service.id} className={`service-item ${service.status}`}>
              <div className="service-info">
                <div className="service-header">
                  <span className="service-name">{service.name}</span>
                  <span className={`service-status-badge ${service.status}`}>
                    {getStatusText(service.status)}
                  </span>
                </div>
                <div className="service-details">
                  <span className="service-port">端口: {service.port}</span>
                  {service.status === 'running' && (
                    <>
                      <span className="service-metric">CPU: {service.cpu}%</span>
                      <span className="service-metric">内存: {service.memory}MB</span>
                    </>
                  )}
                </div>
              </div>
              <div className="service-actions">
                <Button
                  variant={service.status === 'running' ? 'default' : 'primary'}
                  onClick={() => toggleService(service.id)}
                  disabled={service.status === 'error'}
                >
                  {service.status === 'running' ? '停止' : '启动'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 最近活动 */}
      <Card title="最近活动">
        <Table columns={activityColumns} dataSource={recentActivities} rowKey="key" />
      </Card>
    </div>
  );
}
