import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../../styles/navigation-sidebar.css';
import { UserProfileSidebar } from './UserProfileSidebar';

interface NavigationItem {
  path: string;
  label: string;
  icon: string;
}

const navigationItems: NavigationItem[] = [
  { path: '/', label: 'Home', icon: '\u{1F3E0}' },
  { path: '/incoming-data', label: 'Incoming Data', icon: '\u{1F4E5}' },
  { path: '/orders', label: 'Orders', icon: '\u{1F4CB}' },
  { path: '/suppliers', label: 'Suppliers', icon: '\u{1F3ED}' },
  { path: '/retailers', label: 'Retailers', icon: '\u{1F3EA}' },
  { path: '/retailer-suppliers', label: 'Connections', icon: '\u{1F517}' },
  { path: '/product-categories', label: 'Categories', icon: '\u{1F4C1}' },
  { path: '/products', label: 'Products', icon: '\u{1F4E6}' },
  { path: '/locations', label: 'Locations', icon: '\u{1F4CD}' },
  { path: '/units-of-measure', label: 'Units of Measure', icon: '\u{1F4CF}' },
];

const adminNavigationItems: NavigationItem[] = [
  { path: '/users', label: 'Users', icon: '\u{1F465}' },
  { path: '/master-retailers', label: 'System Admin', icon: '\u2699\uFE0F' },
];

const SIDEBAR_COLLAPSED_KEY = 'navigationSidebarCollapsed';
const SIDEBAR_DARK_THEME_KEY = 'navigationSidebarDarkTheme';

export const NavigationSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_DARK_THEME_KEY);
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_DARK_THEME_KEY, String(isDarkTheme));
  }, [isDarkTheme]);

  const toggleSidebar = () => setIsCollapsed(prev => !prev);
  const toggleTheme = () => setIsDarkTheme(prev => !prev);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const renderNavItem = (item: NavigationItem) => {
    const systemAdminPaths = ['/master-retailers', '/field-registry', '/master-retailer-overrides', '/rep-splits'];
    const isSystemAdminActive =
      item.path === '/master-retailers' &&
      systemAdminPaths.some(p => location.pathname.startsWith(p));

    const isActive =
      isSystemAdminActive ||
      location.pathname === item.path ||
      (item.path !== '/' && location.pathname.startsWith(item.path));

    return (
      <button
        key={item.path}
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => handleNavigation(item.path)}
        title={item.label}
      >
        <span className="nav-icon">{item.icon}</span>
        <span className="nav-label">{item.label}</span>
      </button>
    );
  };

  return (
    <div
      className={`navigation-sidebar ${isCollapsed ? 'collapsed' : ''} ${isDarkTheme ? 'dark-theme' : ''}`}
    >
      <div className="sidebar-header">
        <span className="sidebar-logo">Crisp</span>
        <h2 className="sidebar-title">{isCollapsed ? 'OMS' : 'Order Management System'}</h2>
      </div>

      <div className="navigation-items">
        {navigationItems.map(renderNavItem)}

        <div className="nav-section">
          <div className="nav-section-header">
            <span className="nav-section-label">Admin</span>
          </div>
          {adminNavigationItems.map(renderNavItem)}
        </div>
      </div>

      <UserProfileSidebar
        isCollapsed={isCollapsed}
        isDarkTheme={isDarkTheme}
        onThemeToggle={toggleTheme}
      />

      <button
        className="toggle-sidebar-button"
        onClick={toggleSidebar}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="toggle-icon">{isCollapsed ? '\u25B6' : '\u25C0'}</span>
        <span className="toggle-label">{isCollapsed ? 'Expand' : 'Collapse'}</span>
      </button>
    </div>
  );
};
