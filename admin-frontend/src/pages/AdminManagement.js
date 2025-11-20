import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined, KeyOutlined } from '@ant-design/icons';
import request from '../utils/request';
import { getUser } from '../utils/auth';
import dayjs from 'dayjs';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [form] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();
  const currentUser = getUser();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await request.get('/admin/list');
      if (response.success) {
        setAdmins(response.data);
      }
    } catch (error) {
      console.error('Fetch admins error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      const response = await request.post('/admin/add', values);
      if (response.success) {
        message.success('管理员创建成功');
        setCreateModalVisible(false);
        form.resetFields();
        fetchAdmins();
      }
    } catch (error) {
      console.error('Create admin error:', error);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const response = await request.put(`/admin/${id}/status`, { status });
      if (response.success) {
        message.success('状态更新成功');
        fetchAdmins();
      }
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await request.delete(`/admin/${id}`);
      if (response.success) {
        message.success('删除成功');
        fetchAdmins();
      }
    } catch (error) {
      console.error('Delete admin error:', error);
    }
  };

  const handleResetPassword = async (values) => {
    if (!selectedAdmin) return;
    
    try {
      const response = await request.put(`/admin/${selectedAdmin.id}/reset-password`, {
        newPassword: values.newPassword
      });
      if (response.success) {
        message.success('密码重置成功');
        setResetPasswordModalVisible(false);
        resetPasswordForm.resetFields();
        setSelectedAdmin(null);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      message.error('重置密码失败');
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (text) => text || '-'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => {
        const roleMap = {
          super_admin: { color: 'red', text: '超级管理员' },
          admin: { color: 'blue', text: '管理员' }
        };
        const config = roleMap[role] || {};
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'gray'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 180,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '从未登录'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => {
        // 不能操作自己和超级管理员
        if (record.username === currentUser?.username || record.role === 'super_admin') {
          return <span style={{ color: '#999' }}>-</span>;
        }
        
        return (
          <Space size="small">
            <Button
              type="link"
              icon={<KeyOutlined />}
              onClick={() => {
                setSelectedAdmin(record);
                setResetPasswordModalVisible(true);
              }}
            >
              重置密码
            </Button>
            {record.status === 'active' ? (
              <Button
                type="link"
                danger
                icon={<StopOutlined />}
                onClick={() => handleStatusChange(record.id, 'inactive')}
              >
                禁用
              </Button>
            ) : (
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleStatusChange(record.id, 'active')}
              >
                启用
              </Button>
            )}
            <Popconfirm
              title="确定要删除该管理员吗？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>管理员管理</h2>
      </div>

      <div className="table-operations">
        <div></div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
          disabled={currentUser?.role !== 'super_admin'}
        >
          添加管理员
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={admins}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="添加管理员"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="邮箱（可选）" />
          </Form.Item>
          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
            initialValue="admin"
          >
            <Select>
              <Select.Option value="admin">管理员</Select.Option>
              {currentUser?.role === 'super_admin' && (
                <Select.Option value="super_admin">超级管理员</Select.Option>
              )}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`重置密码 - ${selectedAdmin?.username}`}
        open={resetPasswordModalVisible}
        onCancel={() => {
          setResetPasswordModalVisible(false);
          resetPasswordForm.resetFields();
          setSelectedAdmin(null);
        }}
        footer={null}
      >
        <Form
          form={resetPasswordForm}
          onFinish={handleResetPassword}
          layout="vertical"
        >
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入密码' },
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
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认重置
              </Button>
              <Button onClick={() => {
                setResetPasswordModalVisible(false);
                resetPasswordForm.resetFields();
                setSelectedAdmin(null);
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminManagement;
