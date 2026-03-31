import React, { useEffect } from "react";
import "./ui.css";

export type NotificationType = "success" | "failure" | "warning" | "info";

interface NotificationProps {
  notificationType: NotificationType;
  content: string;
  title?: string;
  onDismiss?: () => void;
  isAutoDismissed?: boolean;
  className?: string;
}

const iconMap: Record<NotificationType, string> = {
  success: "✓",
  failure: "!",
  warning: "⚠",
  info: "i",
};

export const Notification: React.FC<NotificationProps> = ({
  notificationType,
  content,
  title,
  onDismiss,
  isAutoDismissed = false,
  className,
}) => {
  useEffect(() => {
    if (isAutoDismissed && onDismiss) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAutoDismissed, onDismiss]);

  return (
    <div
      className={`ui-notification ui-notification--${notificationType}${className ? ` ${className}` : ""}`}
    >
      <span className="ui-notification__icon">{iconMap[notificationType]}</span>
      <div className="ui-notification__content">
        {title && <div className="ui-notification__title">{title}</div>}
        <div>{content}</div>
      </div>
      {onDismiss && (
        <button className="ui-notification__dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
};
