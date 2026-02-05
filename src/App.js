import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      const userData = JSON.parse(storedUser);
      setIsAuthenticated(true);
      setUser(userData);
      setCurrentPage(userData.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentPage(userData.role === 'admin' ? 'admin-dashboard' : 'dashboard');
  };

  const handleRegisterSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentPage(userData.role === 'admin' ? 'admin-dashboard' : 'dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />;
      case 'register':
        return <Register onRegisterSuccess={handleRegisterSuccess} />;
      case 'dashboard':
        return <Dashboard user={user} onLogout={handleLogout} />;
      case 'admin-dashboard':
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      case 'home':
      default:
        return <Home />;
    }
  };

  return (
    <div className="App">
      <Navbar 
        onNavigate={setCurrentPage} 
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        user={user}
      />
      {renderPage()}
    </div>
  );
}

export default App;
