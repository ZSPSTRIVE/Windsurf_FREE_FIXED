import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag } from 'antd';
import { 
  KeyOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  TeamOutlined,
  DashboardOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
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
      width: 140,
      render: (text) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{text}</span>
      )
    },
    {
      title: '操作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 90,
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
      width: 160,
      render: (time) => (
        <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>
          {new Date(time).toLocaleString('zh-CN')}
        </span>
      )
    }
  ];

  // 图表数据
  const chartData = [
    { name: '周一', 提号: 12, 切号: 8 },
    { name: '周二', 提号: 15, 切号: 10 },
    { name: '周三', 提号: 18, 切号: 12 },
    { name: '周四', 提号: 20, 切号: 15 },
    { name: '周五', 提号: 25, 切号: 18 },
    { name: '周六', 提号: 22, 切号: 16 },
    { name: '周日', 提号: 19, 切号: 14 }
  ];

  // 统计卡片配置 - 天宫蓝 + 玫瑰橙 + 淡暗金
  const statCards = [
    {
      title: '总激活码',
      value: statistics.activation?.total_codes || 0,
      icon: <KeyOutlined />,
      iconBg: 'var(--gradient-sky)',  // 天宫蓝
      desc: `活跃 ${statistics.activation?.active_codes || 0} · 过期 ${statistics.activation?.expired_codes || 0}`,
      trend: '+12%'
    },
    {
      title: '总账号数',
      value: statistics.accounts?.total_accounts || 0,
      icon: <UserOutlined />,
      iconBg: 'var(--gradient-rose)',  // 玫瑰橙
      desc: `可用 ${statistics.accounts?.available_accounts || 0} · 已分配 ${statistics.accounts?.assigned_accounts || 0}`,
      trend: '+8%'
    },
    {
      title: '活跃用户',
      value: statistics.users?.total_users || 0,
      icon: <TeamOutlined />,
      iconBg: 'var(--gradient-gold)',  // 淡暗金
      desc: '当前在线用户数',
      trend: '+23%'
    },
    {
      title: '累计提号',
      value: statistics.activation?.total_used_accounts || 0,
      icon: <CheckCircleOutlined />,
      iconBg: 'linear-gradient(135deg, #1a8cd8 0%, #c9a227 100%)',  // 蓝金渐变
      desc: '累计提号总数',
      trend: '+15%'
    }
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div className="page-header">
        <h2>
          <span className="page-header-icon">
            <DashboardOutlined />
          </span>
          数据仪表盘
        </h2>
      </div>
      
      {/* 统计卡片 */}
      <Row gutter={12}>
        {statCards.map((card, index) => (
          <Col span={6} key={index}>
            <div className="stat-card">
              <div 
                className="stat-card-icon"
                style={{ background: card.iconBg, color: 'white' }}
              >
                {card.icon}
              </div>
              <div className="stat-card-label">{card.title}</div>
              <div className="stat-card-value">{card.value.toLocaleString()}</div>
              <div className="stat-card-desc">
                <span>{card.desc}</span>
                <span style={{ 
                  color: 'var(--success)', 
                  marginLeft: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 11
                }}>
                  <RiseOutlined style={{ fontSize: 10 }} />
                  {card.trend}
                </span>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* 图表和日志 */}
      <Row gutter={12} style={{ marginTop: 16 }}>
        <Col span={14}>
          <div className="chart-container">
            <div className="chart-title">
              <span style={{ 
                width: 3, 
                height: 14, 
                background: 'var(--gradient-sky)', 
                borderRadius: 1,
                marginRight: 8,
                display: 'inline-block'
              }} />
              使用趋势
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPickup" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a8cd8" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#1a8cd8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSwitch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e86a3a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#e86a3a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--gray-500)', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--gray-500)', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 6,
                    boxShadow: 'var(--shadow-md)',
                    fontSize: 12
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="提号" 
                  stroke="#1a8cd8" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPickup)"
                />
                <Area 
                  type="monotone" 
                  dataKey="切号" 
                  stroke="#e86a3a" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSwitch)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Col>
        <Col span={10}>
          <div className="ultra-card" style={{ height: '100%' }}>
            <div className="ultra-card-header">
              <div className="ultra-card-title">
                <span style={{ 
                  width: 3, 
                  height: 14, 
                  background: 'var(--gradient-rose)', 
                  borderRadius: 1,
                  display: 'inline-block'
                }} />
                最近操作日志
              </div>
            </div>
            <Table
              columns={logColumns}
              dataSource={statistics.recentLogs}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 280 }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
