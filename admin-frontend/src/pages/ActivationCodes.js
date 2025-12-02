import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, Space, Tag, message, Input, Select, Popconfirm, Descriptions, DatePicker } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import request from '../utils/request';
import dayjs from 'dayjs';

const ActivationCodes = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const [codeDetails, setCodeDetails] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form] = Form.useForm();
  const [systemConfig, setSystemConfig] = useState({
    activation_code_prefix: 'WS',
    activation_code_length: '16',
    default_valid_days: '30',
    max_accounts_per_code: '10'
  });

  useEffect(() => {
    fetchCodes();
    fetchSystemConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchText, statusFilter]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter
      };
      const response = await request.get('/activation/list', { params });
      if (response.success) {
        setCodes(response.data.codes);
        setPagination({
          ...pagination,
          total: response.data.pagination.total
        });
      }
    } catch (error) {
      console.error('Fetch codes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const response = await request.get('/admin/config');
      if (response.success) {
        setSystemConfig(response.data);
        // 更新表单的默认值
        form.setFieldsValue({
          maxAccounts: parseInt(response.data.max_accounts_per_code) || 10,
          validDays: parseInt(response.data.default_valid_days) || 30
        });
      }
    } catch (error) {
      console.error('Fetch system config error:', error);
    }
  };

  const handleCreate = async (values) => {
    try {
      // 处理有效期数据
      let requestData = {
        maxAccounts: values.maxAccounts,
        count: values.count
      };
      
      if (values.expireType === 'datetime' && values.expireDateTime) {
        // 使用指定时间
        requestData.expireDateTime = values.expireDateTime.format('YYYY-MM-DD HH:mm:ss');
      } else {
        // 使用天数
        requestData.validDays = values.validDays;
      }
      
      const response = await request.post('/activation/create', requestData);
      if (response.success) {
        message.success(response.message);
        setCreateModalVisible(false);
        form.resetFields();
        fetchCodes();
      }
    } catch (error) {
      console.error('Create code error:', error);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const response = await request.put(`/activation/${id}/status`, { status });
      if (response.success) {
        message.success('状态更新成功');
        fetchCodes();
      }
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await request.delete(`/activation/${id}`);
      if (response.success) {
        message.success('删除成功');
        fetchCodes();
      }
    } catch (error) {
      console.error('Delete code error:', error);
    }
  };

  const viewDetails = async (record) => {
    setSelectedCode(record);
    setDetailModalVisible(true);
    try {
      const response = await request.get(`/activation/${record.id}/details`);
      if (response.success) {
        setCodeDetails(response.data);
      }
    } catch (error) {
      console.error('Fetch details error:', error);
    }
  };

  const columns = [
    {
      title: '激活码',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          active: { color: 'green', text: '激活' },
          expired: { color: 'red', text: '过期' },
          disabled: { color: 'gray', text: '禁用' }
        };
        const config = statusMap[status] || {};
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '提号限制',
      key: 'accounts',
      width: 120,
      render: (record) => `${record.used_accounts}/${record.max_accounts}`
    },
    {
      title: '有效期',
      key: 'validity',
      width: 200,
      render: (record) => {
        const expireDate = dayjs(record.expire_date);
        const now = dayjs();
        const daysLeft = expireDate.diff(now, 'day');
        return (
          <Space direction="vertical" size={0}>
            <span>{expireDate.format('YYYY-MM-DD HH:mm')}</span>
            <span style={{ fontSize: 12, color: daysLeft > 0 ? '#52c41a' : '#ff4d4f' }}>
              {daysLeft > 0 ? `剩余 ${daysLeft} 天` : '已过期'}
            </span>
          </Space>
        );
      }
    },
    {
      title: '活跃用户',
      dataIndex: 'active_users',
      key: 'active_users',
      width: 100,
      render: (count) => count || 0
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => viewDetails(record)}
          >
            详情
          </Button>
          {record.status === 'active' ? (
            <Popconfirm
              title="确定要禁用该激活码吗？"
              onConfirm={() => handleStatusChange(record.id, 'disabled')}
            >
              <Button type="link" danger icon={<StopOutlined />}>
                禁用
              </Button>
            </Popconfirm>
          ) : record.status === 'disabled' ? (
            <Button 
              type="link" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(record.id, 'active')}
            >
              启用
            </Button>
          ) : null}
          <Popconfirm
            title="确定要删除该激活码吗？"
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
        <h2>激活码管理</h2>
      </div>

      <div className="table-operations">
        <Space>
          <Input.Search
            placeholder="搜索激活码"
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
            <Select.Option value="active">激活</Select.Option>
            <Select.Option value="expired">过期</Select.Option>
            <Select.Option value="disabled">禁用</Select.Option>
          </Select>
        </Space>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          生成激活码
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={codes}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, current: page, pageSize });
          }
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="生成激活码"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={520}
      >
        {/* 显示当前配置信息 */}
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          background: '#f0f2f5', 
          borderRadius: 4 
        }}>
          <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>激活码生成规则（系统配置）：</div>
          <Space size="large" style={{ fontSize: 13 }}>
            <span>前缀: <strong>{systemConfig.activation_code_prefix}</strong></span>
            <span>长度: <strong>{systemConfig.activation_code_length}位</strong></span>
            <span>默认有效期: <strong>{systemConfig.default_valid_days}天</strong></span>
          </Space>
          <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
            示例: {systemConfig.activation_code_prefix}-XXXX-XXXX-XXXX...
          </div>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            label="最大提号数量"
            name="maxAccounts"
            rules={[{ required: true, message: '请输入最大提号数量' }]}
            initialValue={parseInt(systemConfig.max_accounts_per_code) || 10}
            tooltip={`系统默认: ${systemConfig.max_accounts_per_code}个`}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="有效期设置"
            required
            style={{ marginBottom: 8 }}
          >
            <Input.Group compact>
              <Form.Item
                name="expireType"
                initialValue="days"
                noStyle
              >
                <Select style={{ width: '30%' }} onChange={(value) => {
                  if (value === 'datetime') {
                    form.setFieldsValue({ validDays: null });
                  } else {
                    form.setFieldsValue({ expireDateTime: null });
                  }
                }}>
                  <Select.Option value="days">按天数</Select.Option>
                  <Select.Option value="datetime">指定时间</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.expireType !== currentValues.expireType}
              >
                {({ getFieldValue }) => 
                  getFieldValue('expireType') === 'days' ? (
                    <Form.Item
                      name="validDays"
                      noStyle
                      rules={[{ required: true, message: '请输入有效天数' }]}
                      initialValue={parseInt(systemConfig.default_valid_days) || 30}
                    >
                      <InputNumber 
                        min={1} 
                        max={365} 
                        style={{ width: '70%' }} 
                        placeholder={`输入天数（默认${systemConfig.default_valid_days}天）`}
                        addonAfter="天"
                      />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      name="expireDateTime"
                      noStyle
                      rules={[{ required: true, message: '请选择过期时间' }]}
                    >
                      <DatePicker 
                        showTime 
                        format="YYYY-MM-DD HH:mm:ss"
                        style={{ width: '70%' }}
                        placeholder="选择过期时间"
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                      />
                    </Form.Item>
                  )
                }
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item
            label="批量生成数量"
            name="count"
            initialValue={1}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                生成
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
        title="激活码详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCodeDetails(null);
        }}
        footer={null}
        width={800}
      >
        {selectedCode && codeDetails && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="激活码">{selectedCode.code}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedCode.status === 'active' ? '激活' : selectedCode.status === 'expired' ? '过期' : '禁用'}
              </Descriptions.Item>
              <Descriptions.Item label="提号限制">
                {selectedCode.used_accounts}/{selectedCode.max_accounts}
              </Descriptions.Item>
              <Descriptions.Item label="有效期">
                {dayjs(selectedCode.expire_date).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedCode.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="首次激活">
                {selectedCode.activated_at ? dayjs(selectedCode.activated_at).format('YYYY-MM-DD HH:mm') : '未激活'}
              </Descriptions.Item>
            </Descriptions>
            
            <h3 style={{ marginTop: 24 }}>使用日志</h3>
            <Table
              columns={[
                { title: '操作类型', dataIndex: 'action_type', key: 'action_type' },
                { title: '账号', dataIndex: 'account_email', key: 'account_email' },
                { title: '描述', dataIndex: 'description', key: 'description' },
                { 
                  title: '时间', 
                  dataIndex: 'created_at', 
                  key: 'created_at',
                  render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
                }
              ]}
              dataSource={codeDetails.logs}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActivationCodes;
