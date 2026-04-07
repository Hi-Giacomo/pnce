import React from 'react';
import { Card, Table, type ColumnsType } from '../../../../components';
import './index.scss';

interface ServiceData {
  key: string;
  name: string;
  status: string;
  port: number;
  uptime: string;
  requests: number;
}

const mockData: ServiceData[] = [
  {
    key: '1',
    name: '用户服务',
    status: '运行中',
    port: 3001,
    uptime: '3天 12小时',
    requests: 15420,
  },
  { key: '2', name: '订单服务', status: '运行中', port: 3002, uptime: '5天 8小时', requests: 8932 },
  { key: '3', name: '支付服务', status: '运行中', port: 3003, uptime: '2天 6小时', requests: 4567 },
  { key: '4', name: '通知服务', status: '已停止', port: 3004, uptime: '-', requests: 0 },
  {
    key: '5',
    name: '日志服务',
    status: '运行中',
    port: 3005,
    uptime: '7天 3小时',
    requests: 23456,
  },
];

const columns: ColumnsType[] = [
  { title: '服务名称', dataIndex: 'name', key: 'name' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (value) => (
      <span className={`status-tag ${value === '运行中' ? 'running' : 'stopped'}`}>
        {(value as string) || ''}
      </span>
    ),
  },
  { title: '端口', dataIndex: 'port', key: 'port' },
  { title: '运行时间', dataIndex: 'uptime', key: 'uptime' },
  { title: '请求数', dataIndex: 'requests', key: 'requests' },
];

export function ServiceList() {
  return (
    <Card title="服务列表">
      <Table columns={columns} dataSource={mockData} rowKey="key" />
    </Card>
  );
}
