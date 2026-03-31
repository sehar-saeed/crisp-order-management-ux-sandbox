import { useState, useRef, useEffect } from 'react';
import { useSession } from '../../hooks/useSession';
import { notificationService } from '../../services/NotificationService';
import '../../styles/user-profile-sidebar.css';

interface UserProfileSidebarProps {
  isCollapsed: boolean;
  isDarkTheme: boolean;
  onThemeToggle: () => void;
}

export const UserProfileSidebar: React.FC<UserProfileSidebarProps> = ({
  isCollapsed,
  isDarkTheme,
  onThemeToggle,
}) => {
  const { user } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const handleLogout = () => {
    notificationService.info('Logout not available in sandbox');
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDropdownOpen]);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div ref={dropdownRef}>
      <div className={`theme-toggle-container ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed && <span className="theme-toggle-label">Dark Theme</span>}
        {isCollapsed && (
          <span className="nav-icon">{isDarkTheme ? '\u{1F319}' : '\u2600\uFE0F'}</span>
        )}
        <label className="theme-toggle-switch">
          <input
            type="checkbox"
            checked={isDarkTheme}
            onChange={onThemeToggle}
            aria-label="Toggle dark theme"
          />
          <span className="theme-toggle-slider"></span>
        </label>
      </div>

      <button
        ref={buttonRef}
        className={`user-profile-sidebar-button ${isCollapsed ? 'collapsed' : ''}`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-label="User profile menu"
      >
        <div className="user-avatar">
          <span className="user-avatar-initials">{getInitials(user.name)}</span>
        </div>
        {!isCollapsed && (
          <>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <span className="chevron-icon">\u25B8</span>
          </>
        )}
      </button>

      {isDropdownOpen && buttonRect && (
        <div
          className="user-profile-sidebar-dropdown"
          style={{
            position: 'fixed',
            top: `${buttonRect.top}px`,
            left: `${buttonRect.right + 8}px`,
          }}
        >
          <button
            className="dropdown-menu-item danger"
            onClick={handleLogout}
          >
            <span className="menu-item-icon">{'\u{1F6AA}'}</span>
            <span className="menu-item-label">Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
