import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Input, Button, message, Space, Divider, Typography } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import request from '../utils/request';
import { getUser } from '../utils/auth';

const { Title, Paragraph } = Typography;

const SystemConfig = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const currentUser = getUser();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await request.get('/admin/config');
      if (response.success) {
        form.setFieldsValue({
          activation_code_prefix: response.data.activation_code_prefix,
          activation_code_length: parseInt(response.data.activation_code_length),
          default_valid_days: parseInt(response.data.default_valid_days),
          max_accounts_per_code: parseInt(response.data.max_accounts_per_code)
        });
      }
    } catch (error) {
      console.error('Fetch config error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    if (currentUser?.role !== 'super_admin') {
      message.error('只有超级管理员才能修改系统配置');
      return;
    }

    setSaving(true);
    try {
      const response = await request.put('/admin/config', values);
      if (response.success) {
        message.success('配置保存成功');
      }
    } catch (error) {
      console.error('Save config error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>系统配置</h2>
      </div>

      <Card loading={loading}>
        <Title level={4}>基础配置</Title>
        <Paragraph type="secondary">
          配置系统的基本参数，这些设置将影响激活码生成和账号管理的默认行为。
        </Paragraph>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="激活码前缀"
            name="activation_code_prefix"
            rules={[{ required: true, message: '请输入激活码前缀' }]}
            extra="生成的激活码将以此前缀开头"
          >
            <Input 
              placeholder="如: WS" 
              maxLength={5}
              disabled={currentUser?.role !== 'super_admin'}
            />
          </Form.Item>

          <Form.Item
            label="激活码长度"
            name="activation_code_length"
            rules={[{ required: true, message: '请输入激活码长度' }]}
            extra="不包含前缀和分隔符的字符长度"
          >
            <InputNumber 
              min={8} 
              max={32} 
              style={{ width: '100%' }}
              disabled={currentUser?.role !== 'super_admin'}
            />
          </Form.Item>

          <Form.Item
            label="默认有效天数"
            name="default_valid_days"
            rules={[{ required: true, message: '请输入默认有效天数' }]}
            extra="新生成激活码的默认有效期"
          >
            <InputNumber 
              min={1} 
              max={365} 
              style={{ width: '100%' }}
              disabled={currentUser?.role !== 'super_admin'}
            />
          </Form.Item>

          <Form.Item
            label="默认最大账号数"
            name="max_accounts_per_code"
            rules={[{ required: true, message: '请输入默认最大账号数' }]}
            extra="每个激活码默认可提取的账号数量"
          >
            <InputNumber 
              min={1} 
              max={100} 
              style={{ width: '100%' }}
              disabled={currentUser?.role !== 'super_admin'}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={saving}
                icon={<SaveOutlined />}
                disabled={currentUser?.role !== 'super_admin'}
              >
                保存配置
              </Button>
              <Button 
                onClick={fetchConfig}
                icon={<ReloadOutlined />}
              >
                重新加载
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {currentUser?.role !== 'super_admin' && (
          <Divider />
        )}
        {currentUser?.role !== 'super_admin' && (
          <Paragraph type="warning">
            注意：只有超级管理员才能修改系统配置
          </Paragraph>
        )}
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>配置说明</Title>
        <Paragraph>
          <ul>
            <li><strong>激活码前缀：</strong>所有生成的激活码都将以此前缀开头，便于识别</li>
            <li><strong>激活码长度：</strong>决定激活码的复杂度，长度越长越安全</li>
            <li><strong>默认有效天数：</strong>新生成的激活码默认在多少天后过期</li>
            <li><strong>默认最大账号数：</strong>每个激活码默认可以提取的账号数量上限</li>
          </ul>
        </Paragraph>
      </Card>
    </div>
  );
};

export default SystemConfig;
