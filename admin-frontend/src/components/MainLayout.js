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
  ThunderboltFilled,
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
      navigate('/profile');
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
        icon: <LogoutOutlined />,
        danger: true
      }
    ],
    onClick: handleUserMenuClick
  };

  const roleLabels = {
    super_admin: '超级管理员',
    admin: '管理员'
  };

  return (
    <Layout className="ultra-layout" style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={200}
        collapsedWidth={48}
        className="ultra-sider"
      >
        {/* Logo区域 */}
        <div className={`sider-logo ${collapsed ? 'sider-logo-collapsed' : ''}`}>
          <div className="sider-logo-icon">
            <ThunderboltFilled />
          </div>
          {!collapsed && <span className="sider-logo-text">WindSurf</span>}
        </div>
        
        {/* 导航菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="ultra-menu"
        />
      </Sider>
      
      <Layout>
        {/* 顶部栏 */}
        <Header className="ultra-header">
          <div className="header-title">
            续杯工具管理后台
            <span className="header-title-badge">v1.0</span>
          </div>
          
          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <div className="header-user">
              <Avatar 
                size={36} 
                icon={<UserOutlined />} 
                className="header-user-avatar"
              />
              <div className="header-user-info">
                <span className="header-user-name">{user?.username || 'Admin'}</span>
                <span className="header-user-role">{roleLabels[user?.role] || '管理员'}</span>
              </div>
              <DownOutlined style={{ fontSize: 12, color: 'var(--gray-400)' }} />
            </div>
          </Dropdown>
        </Header>
        
        {/* 内容区 */}
        <Content className="ultra-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
