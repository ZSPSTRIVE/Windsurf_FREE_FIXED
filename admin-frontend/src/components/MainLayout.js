import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, message } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  KeyOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  ImportOutlined,
  LogoutOutlined,
  DownOutlined
} from '@ant-design/icons';
import { removeToken, getUser } from '../utils/auth';

const { Header, Sider, Content } = Layout;

const MainLayout = ({ onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    },
    {
      key: '/activation-codes',
      icon: <KeyOutlined />,
      label: '激活码管理'
    },
    {
      key: '/accounts',
      icon: <UserOutlined />,
      label: '账号管理'
    },
    {
      key: '/token-import',
      icon: <ImportOutlined />,
      label: 'Token导入'
    },
    {
      key: '/admin-management',
      icon: <TeamOutlined />,
      label: '管理员管理'
    },
    {
      key: '/system-config',
      icon: <SettingOutlined />,
      label: '系统配置'
    }
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    removeToken();
    onLogout();
    navigate('/login');
  };

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'change-password') {
      navigate('/change-password');
    } else if (key === 'profile') {
      message.info('个人信息功能开发中');
    }
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: '个人信息',
        icon: <UserOutlined />
      },
      {
        key: 'change-password',
        label: '修改密码',
        icon: <KeyOutlined />
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        label: '退出登录',
        icon: <LogoutOutlined />
      }
    ],
    onClick: handleUserMenuClick
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 20 : 24,
          fontWeight: 'bold'
        }}>
          {collapsed ? 'WS' : 'WindSurf'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <h2>WindSurf续杯工具管理后台</h2>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.username || 'Admin'}</span>
              <DownOutlined />
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
