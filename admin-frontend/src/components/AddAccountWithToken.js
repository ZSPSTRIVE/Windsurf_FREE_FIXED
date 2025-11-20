import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Alert } from 'antd';
import request from '../utils/request';

const AddAccountWithToken = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await request.post('/account-token/add-with-token', values);
      if (response.success) {
        message.success('账号添加成功');
        form.resetFields();
        onSuccess();
      }
    } catch (error) {
      console.error('Add account with token error:', error);
      message.error(error.message || '添加失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="通过 Token 添加账号"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
    >
      <Alert
        message="使用说明"
        description="输入邮箱和 Token，系统会自动解析出 API Key 和用户名称"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input placeholder="例如: user@example.com" />
        </Form.Item>

        <Form.Item
          label="Token"
          name="token"
          rules={[{ required: true, message: '请输入 Token' }]}
        >
          <Input.TextArea 
            placeholder="例如: IVNDnF_ObV46hXtqTmCU1b5zOWDBsCrkdAG8Jeqb44w"
            rows={2}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            添加账号
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddAccountWithToken;
