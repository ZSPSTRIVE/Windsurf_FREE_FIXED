import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space } from 'antd';
import { 
  KeyOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import request from '../utils/request';

const Dashboard = () => {
  const [statistics, setStatistics] = useState({
    activation: {},
    accounts: {},
    users: {},
    recentLogs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await request.get('/admin/statistics');
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Fetch statistics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const actionTypeMap = {
    activate: { text: '激活', color: 'blue' },
    pickup: { text: '提号', color: 'green' },
    switch: { text: '切号', color: 'orange' },
    expire: { text: '过期', color: 'red' }
  };

  const logColumns = [
    {
      title: '激活码',
      dataIndex: 'code',
      key: 'code',
      ellipsis: true,
      width: 150
    },
    {
      title: '操作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 100,
      render: (type) => {
        const action = actionTypeMap[type];
        return action ? <Tag color={action.color}>{action.text}</Tag> : type;
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => new Date(time).toLocaleString('zh-CN')
    }
  ];

  // 模拟图表数据
  const chartData = [
    { name: '周一', 提号: 12, 切号: 8 },
    { name: '周二', 提号: 15, 切号: 10 },
    { name: '周三', 提号: 18, 切号: 12 },
    { name: '周四', 提号: 20, 切号: 15 },
    { name: '周五', 提号: 25, 切号: 18 },
    { name: '周六', 提号: 22, 切号: 16 },
    { name: '周日', 提号: 19, 切号: 14 }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>
      
      <Row gutter={16}>
        <Col span={6}>
          <Card className="dashboard-stat-card">
            <Statistic
              title="总激活码"
              value={statistics.activation.total_codes || 0}
              prefix={<KeyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="stat-desc">
              活跃: {statistics.activation.active_codes || 0} / 
              过期: {statistics.activation.expired_codes || 0}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-stat-card">
            <Statistic
              title="总账号数"
              value={statistics.accounts.total_accounts || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="stat-desc">
              可用: {statistics.accounts.available_accounts || 0} / 
              已分配: {statistics.accounts.assigned_accounts || 0}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-stat-card">
            <Statistic
              title="活跃用户"
              value={statistics.users.total_users || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="stat-desc">当前在线用户数</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-stat-card">
            <Statistic
              title="已提号次数"
              value={statistics.activation.total_used_accounts || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className="stat-desc">累计提号总数</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={14}>
          <Card title="使用趋势" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="提号" stroke="#1890ff" strokeWidth={2} />
                <Line type="monotone" dataKey="切号" stroke="#52c41a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={10}>
          <Card 
            title="最近操作日志" 
            bordered={false}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              columns={logColumns}
              dataSource={statistics.recentLogs}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
