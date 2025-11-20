import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Space, Typography } from 'antd';
import { SaveOutlined, LockOutlined } from '@ant-design/icons';
import request from '../utils/request';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await request.put('/admin/change-password', values);
      if (response.success) {
        message.success('密码修改成功，请重新登录');
        // 清除token并跳转到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Change password error:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('修改密码失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_, value) => {
    if (!value) {
      return Promise.reject('请输入密码');
    }
    if (value.length < 6) {
      return Promise.reject('密码至少6个字符');
    }
    // 密码强度验证（可选）
    const hasNumber = /\d/.test(value);
    const hasLetter = /[a-zA-Z]/.test(value);
    if (!hasNumber || !hasLetter) {
      return Promise.reject('密码必须包含字母和数字');
    }
    return Promise.resolve();
  };

  return (
    <div>
      <div className="page-header">
        <h2>修改密码</h2>
      </div>

      <Card style={{ maxWidth: 600, margin: '0 auto' }}>
        <Title level={4}>
          <LockOutlined /> 修改账号密码
        </Title>
        <Paragraph type="secondary">
          为了账号安全，请定期修改密码。密码修改成功后需要重新登录。
        </Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="原密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password 
              placeholder="请输入当前密码" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[{ validator: validatePassword }]}
          >
            <Input.Password 
              placeholder="请输入新密码（至少6个字符，包含字母和数字）" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
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
              placeholder="请再次输入新密码" 
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
              >
                提交修改
              </Button>
              <Button 
                onClick={() => form.resetFields()}
                size="large"
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, padding: 16, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
          <Title level={5}>密码安全建议：</Title>
          <ul style={{ marginBottom: 0 }}>
            <li>使用至少6个字符的密码</li>
            <li>包含大小写字母、数字和特殊字符</li>
            <li>不要使用容易猜测的密码（如123456、password等）</li>
            <li>定期更换密码</li>
            <li>不要与其他系统使用相同的密码</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ChangePassword;
