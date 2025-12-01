import React, { useState } from 'react';
import { Card, Form, Input, Button, Avatar, message, Row, Col, Divider, Tag, Space, Progress } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  SafetyOutlined,
  ClockCircleOutlined,
  EditOutlined,
  SaveOutlined,
  KeyOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { getUser } from '../utils/auth';
import request from '../utils/request';
import dayjs from 'dayjs';

const Profile = () => {
  const user = getUser();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      const response = await request.put('/auth/profile', values);
      if (response.success) {
        message.success('个人信息更新成功');
        setEditing(false);
      }
    } catch (error) {
      console.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      const response = await request.post('/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      if (response.success) {
        message.success('密码修改成功');
        passwordForm.resetFields();
      }
    } catch (error) {
      console.error('Change password error:', error);
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleConfig = {
    super_admin: { label: '超级管理员', color: 'var(--gradient-rose)', icon: <CrownOutlined /> },
    admin: { label: '管理员', color: 'var(--gradient-sky)', icon: <SafetyOutlined /> }
  };

  const currentRole = roleConfig[user?.role] || roleConfig.admin;

  return (
    <div className="profile-page">
      {/* 页面标题 */}
      <div className="page-header">
        <h2>
          <span className="page-header-icon">
            <UserOutlined />
          </span>
          个人中心
        </h2>
      </div>

      <Row gutter={16}>
        {/* 左侧 - 用户卡片 */}
        <Col span={8}>
          <div className="profile-card">
            {/* 背景装饰 */}
            <div className="profile-card-bg"></div>
            
            {/* 头像区域 */}
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                <Avatar 
                  size={80} 
                  icon={<UserOutlined />}
                  className="profile-avatar"
                />
                <div className="profile-avatar-badge" style={{ background: currentRole.color }}>
                  {currentRole.icon}
                </div>
              </div>
              <h3 className="profile-name">{user?.username || 'Admin'}</h3>
              <Tag 
                className="profile-role-tag"
                style={{ background: currentRole.color, border: 'none', color: 'white' }}
              >
                {currentRole.label}
              </Tag>
            </div>

            <Divider style={{ margin: '20px 0' }} />

            {/* 账户信息 */}
            <div className="profile-info-list">
              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <MailOutlined />
                </div>
                <div className="profile-info-content">
                  <span className="profile-info-label">邮箱</span>
                  <span className="profile-info-value">{user?.email || '未设置'}</span>
                </div>
              </div>
              
              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <ClockCircleOutlined />
                </div>
                <div className="profile-info-content">
                  <span className="profile-info-label">上次登录</span>
                  <span className="profile-info-value">
                    {user?.last_login ? dayjs(user.last_login).format('MM-DD HH:mm') : '首次登录'}
                  </span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <SafetyOutlined />
                </div>
                <div className="profile-info-content">
                  <span className="profile-info-label">账户状态</span>
                  <span className="profile-info-value" style={{ color: 'var(--success)' }}>
                    ● 正常
                  </span>
                </div>
              </div>
            </div>

            {/* 安全评分 */}
            <div className="profile-security">
              <div className="profile-security-header">
                <span>安全评分</span>
                <span style={{ color: 'var(--sky-500)', fontWeight: 600 }}>85分</span>
              </div>
              <Progress 
                percent={85} 
                showInfo={false}
                strokeColor={{
                  '0%': '#1a8cd8',
                  '100%': '#36a3eb',
                }}
                trailColor="var(--gray-200)"
                size="small"
              />
              <div className="profile-security-tips">
                建议开启双因素认证以提升安全性
              </div>
            </div>
          </div>
        </Col>

        {/* 右侧 - 设置表单 */}
        <Col span={16}>
          {/* 基本信息 */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-title">
                <EditOutlined />
                <span>基本信息</span>
              </div>
              {!editing ? (
                <Button 
                  type="text" 
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                >
                  编辑
                </Button>
              ) : (
                <Space>
                  <Button onClick={() => setEditing(false)}>取消</Button>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={() => form.submit()}
                  >
                    保存
                  </Button>
                </Space>
              )}
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={{
                username: user?.username,
                email: user?.email
              }}
              disabled={!editing}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="用户名"
                    name="username"
                  >
                    <Input 
                      prefix={<UserOutlined style={{ color: 'var(--gray-400)' }} />}
                      placeholder="用户名"
                      disabled
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="邮箱"
                    name="email"
                    rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                  >
                    <Input 
                      prefix={<MailOutlined style={{ color: 'var(--gray-400)' }} />}
                      placeholder="请输入邮箱"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>

          {/* 修改密码 */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-title">
                <KeyOutlined />
                <span>修改密码</span>
              </div>
            </div>

            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="当前密码"
                    name="oldPassword"
                    rules={[{ required: true, message: '请输入当前密码' }]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined style={{ color: 'var(--gray-400)' }} />}
                      placeholder="当前密码"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="新密码"
                    name="newPassword"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, message: '密码至少6个字符' }
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined style={{ color: 'var(--gray-400)' }} />}
                      placeholder="新密码"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="确认新密码"
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: '请确认新密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject('两次输入的密码不一致');
                        },
                      }),
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined style={{ color: 'var(--gray-400)' }} />}
                      placeholder="确认新密码"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={passwordLoading}
                  icon={<SafetyOutlined />}
                >
                  更新密码
                </Button>
              </Form.Item>
            </Form>
          </div>

          {/* 登录历史 */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-title">
                <ClockCircleOutlined />
                <span>登录历史</span>
              </div>
            </div>

            <div className="login-history">
              {[
                { time: '今天 12:30', ip: '192.168.1.100', device: 'Chrome / Windows', current: true },
                { time: '昨天 18:45', ip: '192.168.1.100', device: 'Chrome / Windows' },
                { time: '12-28 09:15', ip: '10.0.0.55', device: 'Firefox / MacOS' },
              ].map((item, index) => (
                <div key={index} className={`login-history-item ${item.current ? 'current' : ''}`}>
                  <div className="login-history-dot"></div>
                  <div className="login-history-content">
                    <div className="login-history-time">
                      {item.time}
                      {item.current && <Tag color="green" style={{ marginLeft: 8 }}>当前会话</Tag>}
                    </div>
                    <div className="login-history-info">
                      <span>{item.ip}</span>
                      <span className="login-history-divider">•</span>
                      <span>{item.device}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
