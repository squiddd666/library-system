import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      closeSidebar();
    }
  }, [location.pathname, isMobile]);

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/books')) return 'AVAILABLE BOOKS';
    if (path.includes('/borrowed')) return 'BORROWED BOOKS';
    if (path.includes('/returned')) return 'RETURNED BOOKS';
    if (path.includes('/profile')) return 'MY PROFILE';
    if (path.includes('/settings')) return 'SETTINGS';
    return 'STUDENT DASHBOARD HOME';
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const menuItems = [
    { icon: '📊', label: 'Dashboard', path: '/student-dashboard' },
    { icon: '📚', label: 'Books', path: '/student-dashboard/books' },
    { icon: '📖', label: 'Borrowed', path: '/student-dashboard/borrowed' },
    { icon: '✅', label: 'Returned', path: '/student-dashboard/returned' },
    { icon: '👤', label: 'Profile', path: '/student-dashboard/profile' },
    { icon: '⚙️', label: 'Settings', path: '/student-dashboard/settings' }
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="hamburger-btn"
            onClick={handleSidebarToggle}
          >
            ☰
          </button>
          <h1 className="page-title">{getPageTitle()}</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{JSON.parse(localStorage.getItem('user') || '{}').first_name}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end={item.path === '/student-dashboard'}
                onClick={() => isMobile && closeSidebar()}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
            
            {/* Logout Button */}
            <div
              className="nav-item logout-item"
              onClick={handleLogout}
            >
              <span className="nav-icon">🚪</span>
              <span className="nav-label">Logout</span>
            </div>
          </nav>
        </aside>
        {isMobile && sidebarOpen && (
          <button
            type="button"
            className="sidebar-overlay"
            aria-label="Close sidebar"
            onClick={closeSidebar}
          />
        )}

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
