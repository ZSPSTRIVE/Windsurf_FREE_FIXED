import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request';
import { saveToken, saveUser } from '../utils/auth';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await request.post('/auth/login', values);
      if (response.success) {
        saveToken(response.data.token);
        saveUser(response.data.user);
        message.success('登录成功');
        onLogin();
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <ThunderboltFilled style={{ fontSize: 36, color: 'white' }} />
        </div>
        
        <h1 className="login-title">WindSurf</h1>
        <p className="login-subtitle">续杯工具管理后台</p>
        
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: 'var(--gray-400)' }} />} 
              placeholder="用户名" 
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--gray-400)' }} />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              style={{ height: 48, fontSize: 16, fontWeight: 600 }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
        
        {/* 登录提示 */}
        <div className="login-hint">
          <div className="login-hint-title">默认管理员账号</div>
          <div className="login-hint-text">admin / Admin@123456</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
