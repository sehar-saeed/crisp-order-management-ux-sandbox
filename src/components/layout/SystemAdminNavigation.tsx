import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import '../../styles/system-admin-nav.css';

const navItems = [
  { path: '/master-retailers', label: 'Master Retailers' },
  { path: '/master-retailer-overrides', label: 'Retailer/Client Overrides' },
  { path: '/field-registry', label: 'Field Registry' },
  { path: '/rep-splits', label: 'Rep Splits' },
];

export const SystemAdminNavigation: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const systemAdminPaths = ['/master-retailers', '/field-registry', '/master-retailer-overrides', '/rep-splits'];
    if (systemAdminPaths.some(path => location.pathname.startsWith(path))) {
      localStorage.setItem('lastSystemAdminPage', location.pathname);
    }
  }, [location.pathname]);

  return (
    <nav className="system-admin-nav">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`system-admin-nav-item ${
            location.pathname.startsWith(item.path) ? 'active' : ''
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};
