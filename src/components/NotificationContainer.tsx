import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { notificationService } from '../services/NotificationService';
import type { NotificationItem, NotificationType } from '../services/NotificationService';

const typeStyles: Record<NotificationType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: '#f0fdf4', border: '#22c55e', color: '#166534', icon: '\u2713' },
  failure: { bg: '#fef2f2', border: '#ef4444', color: '#991b1b', icon: '\u2717' },
  warning: { bg: '#fffbeb', border: '#f59e0b', color: '#92400e', icon: '\u26A0' },
  info: { bg: '#eff6ff', border: '#3b82f6', color: '#1e40af', icon: '\u2139' },
};

const SandboxNotification: React.FC<{
  notification: NotificationItem;
  onDismiss: () => void;
}> = ({ notification, onDismiss }) => {
  const style = typeStyles[notification.notificationType];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 18px',
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '8px',
        color: style.color,
        fontSize: '14px',
        fontFamily: 'var(--font-primary)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        minWidth: '300px',
        maxWidth: '400px',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>{style.icon}</span>
      <div style={{ flex: 1 }}>
        {notification.title && (
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{notification.title}</div>
        )}
        <div>{notification.content}</div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: style.color,
          fontSize: '16px',
          padding: 0,
          lineHeight: 1,
          opacity: 0.6,
        }}
        aria-label="Dismiss notification"
      >
        \u2715
      </button>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  if (notifications.length === 0) return null;

  const notificationElements = (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '400px',
        pointerEvents: 'none',
      }}
    >
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            pointerEvents: 'auto',
            transform: `translateY(${index * 4}px)`,
          }}
        >
          <SandboxNotification
            notification={notification}
            onDismiss={() => notificationService.dismiss(notification.id)}
          />
        </div>
      ))}
    </div>
  );

  return createPortal(notificationElements, document.body);
};
