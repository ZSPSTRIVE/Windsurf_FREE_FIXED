import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Tag, message, Select, Popconfirm, Card, Statistic, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, RedoOutlined, KeyOutlined } from '@ant-design/icons';
import request from '../utils/request';
import dayjs from 'dayjs';
import AddAccountWithToken from '../components/AddAccountWithToken';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  useEffect(() => {
    fetchAccounts();
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchText, statusFilter, assignedFilter]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
        isAssigned: assignedFilter
      };
      const response = await request.get('/account/list', { params });
      if (response.success) {
        setAccounts(response.data.accounts);
        setPagination({
          ...pagination,
          total: response.data.pagination.total
        });
      }
    } catch (error) {
      console.error('Fetch accounts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await request.get('/account/statistics');
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Fetch statistics error:', error);
    }
  };

  const handleCreate = async (values) => {
    try {
      const response = await request.post('/account/add', values);
      if (response.success) {
        message.success('账号添加成功');
        setCreateModalVisible(false);
        form.resetFields();
        fetchAccounts();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Create account error:', error);
    }
  };

  const handleEdit = async (values) => {
    try {
      const response = await request.put(`/account/${selectedAccount.id}`, values);
      if (response.success) {
        message.success('账号更新成功');
        setEditModalVisible(false);
        editForm.resetFields();
        fetchAccounts();
      }
    } catch (error) {
      console.error('Update account error:', error);
    }
  };

  const handleBatchAdd = async (values) => {
    try {
      // 解析批量账号数据
      const lines = values.batchData.split('\n').filter(line => line.trim());
      const accounts = lines.map(line => {
        const [email, name, apiKey] = line.split(',').map(s => s.trim());
        return { email, name, apiKey };
      });

      const response = await request.post('/account/batch-add', { accounts });
      if (response.success) {
        message.success(`成功添加 ${response.data.summary.success} 个账号`);
        if (response.data.summary.fail > 0) {
          message.warning(`失败 ${response.data.summary.fail} 个账号`);
        }
        setBatchModalVisible(false);
        batchForm.resetFields();
        fetchAccounts();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Batch add error:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await request.delete(`/account/${id}`);
      if (response.success) {
        message.success('删除成功');
        fetchAccounts();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Delete account error:', error);
    }
  };
  
  const handleResetAssignment = async (id) => {
    try {
      const response = await request.post(`/account/reset-assignment/${id}`);
      if (response.success) {
        message.success('账号分配状态已重置');
        fetchAccounts();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Reset assignment error:', error);
      message.error('重置失败');
    }
  };
  
  const handleResetAllAssignments = async () => {
    Modal.confirm({
      title: '批量重置',
      content: '确定要重置所有账号的分配状态吗？这将使所有已分配的账号重新变为可用状态。',
      onOk: async () => {
        try {
          const response = await request.post('/account/reset-all-assignments');
          if (response.success) {
            message.success(response.message);
            fetchAccounts();
            fetchStatistics();
          }
        } catch (error) {
          console.error('Reset all assignments error:', error);
          message.error('批量重置失败');
        }
      }
    });
  };

  const columns = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true
    },
    {
      title: 'API Key',
      dataIndex: 'api_key',
      key: 'api_key',
      width: 200,
      ellipsis: true,
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {text ? text.substring(0, 20) + '...' : '-'}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          active: { color: 'green', text: '可用' },
          inactive: { color: 'gray', text: '停用' },
          used: { color: 'blue', text: '使用中' }
        };
        const config = statusMap[status] || {};
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '分配状态',
      key: 'assigned',
      width: 120,
      render: (record) => (
        record.is_assigned ? (
          <Tag color="orange">已分配</Tag>
        ) : (
          <Tag color="green">未分配</Tag>
        )
      )
    },
    {
      title: '分配给',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      width: 150,
      ellipsis: true,
      render: (text) => text || '-'
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
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.is_assigned && (
            <Button 
              type="link" 
              icon={<RedoOutlined />}
              onClick={() => handleResetAssignment(record.id)}
            >
              重置
            </Button>
          )}
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedAccount(record);
              editForm.setFieldsValue({
                email: record.email,
                name: record.name,
                apiKey: record.api_key,
                status: record.status
              });
              setEditModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该账号吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>账号管理</h2>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总账号数"
              value={statistics.total || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            borderColor: statistics.available <= 5 ? '#ff4d4f' : undefined,
            borderWidth: statistics.available <= 5 ? 2 : 1
          }}>
            <Statistic
              title="可用账号"
              value={statistics.available || 0}
              valueStyle={{ 
                color: statistics.available <= 5 ? '#ff4d4f' : '#52c41a' 
              }}
              prefix={<CheckCircleOutlined />}
              suffix={statistics.available <= 5 && statistics.available > 0 ? ' (库存不足)' : ''}
            />
            {statistics.available === 0 && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 8 }}>
                ⚠️ 账号池已空，请立即补充
              </div>
            )}
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已分配"
              value={statistics.assigned || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="使用率"
              value={statistics.total ? ((statistics.assigned / statistics.total) * 100).toFixed(1) : 0}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="table-operations">
        <Space>
          <Input.Search
            placeholder="搜索邮箱或名称"
            allowClear
            onSearch={(value) => setSearchText(value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 120 }}
            onChange={setStatusFilter}
          >
            <Select.Option value="active">可用</Select.Option>
            <Select.Option value="inactive">停用</Select.Option>
            <Select.Option value="used">使用中</Select.Option>
          </Select>
          <Select
            placeholder="分配状态"
            allowClear
            style={{ width: 120 }}
            onChange={setAssignedFilter}
          >
            <Select.Option value="true">已分配</Select.Option>
            <Select.Option value="false">未分配</Select.Option>
          </Select>
        </Space>
        <Space>
          <Button onClick={() => setBatchModalVisible(true)}>
            批量导入
          </Button>
          <Button 
            icon={<KeyOutlined />}
            onClick={() => setTokenModalVisible(true)}
          >
            Token添加
          </Button>
          <Button 
            onClick={handleResetAllAssignments}
          >
            批量重置分配
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            添加账号
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={accounts}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, current: page, pageSize });
          }
        }}
        scroll={{ x: 1400 }}
      />

      <Modal
        title="添加账号"
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
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="example@domain.com" />
          </Form.Item>
          <Form.Item
            label="账号名称"
            name="name"
            rules={[{ required: true, message: '请输入账号名称' }]}
          >
            <Input placeholder="账号名称" />
          </Form.Item>
          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[{ required: true, message: '请输入API Key' }]}
          >
            <Input.TextArea rows={3} placeholder="输入API Key" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
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
        title="编辑账号"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEdit}
        >
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="账号名称"
            name="name"
            rules={[{ required: true, message: '请输入账号名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[{ required: true, message: '请输入API Key' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
          >
            <Select>
              <Select.Option value="active">可用</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
              <Select.Option value="used">使用中</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                更新
              </Button>
              <Button onClick={() => {
                setEditModalVisible(false);
                editForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入账号"
        open={batchModalVisible}
        onCancel={() => {
          setBatchModalVisible(false);
          batchForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchAdd}
        >
          <Form.Item
            label="批量数据"
            name="batchData"
            rules={[{ required: true, message: '请输入账号数据' }]}
            extra="格式：邮箱,名称,API Key（每行一个账号）"
          >
            <Input.TextArea 
              rows={10} 
              placeholder={`example1@domain.com,账号1,apikey1
example2@domain.com,账号2,apikey2
example3@domain.com,账号3,apikey3`}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                导入
              </Button>
              <Button onClick={() => {
                setBatchModalVisible(false);
                batchForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <AddAccountWithToken
        visible={tokenModalVisible}
        onCancel={() => setTokenModalVisible(false)}
        onSuccess={() => {
          setTokenModalVisible(false);
          fetchAccounts();
          fetchStatistics();
        }}
      />
    </div>
  );
};

export default Accounts;
