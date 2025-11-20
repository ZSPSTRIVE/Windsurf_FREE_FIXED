import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { message } from 'antd';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/MainLayout';
import ActivationCodes from './pages/ActivationCodes';
import Accounts from './pages/Accounts';
import TokenImport from './pages/TokenImport';
import AdminManagement from './pages/AdminManagement';
import SystemConfig from './pages/SystemConfig';
import ChangePassword from './pages/ChangePassword';
import { getToken } from './utils/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    message.success('已退出登录');
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        
        <Route path="/" element={
          isAuthenticated ? <MainLayout onLogout={handleLogout} /> : <Navigate to="/login" />
        }>
          <Route index element={<Dashboard />} />
          <Route path="activation-codes" element={<ActivationCodes />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="token-import" element={<TokenImport />} />
          <Route path="admin-management" element={<AdminManagement />} />
          <Route path="system-config" element={<SystemConfig />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
