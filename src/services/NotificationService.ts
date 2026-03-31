export type NotificationType = 'success' | 'failure' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  notificationType: NotificationType;
  content: string;
  title?: string;
  autoHideDelay?: number;
}

class NotificationService {
  private listeners: ((notifications: NotificationItem[]) => void)[] = [];
  private notifications: NotificationItem[] = [];

  show(notification: Omit<NotificationItem, 'id'>) {
    const id = crypto.randomUUID();
    const defined = Object.fromEntries(
      Object.entries(notification).filter(([, v]) => v !== undefined),
    );
    const newNotification = {
      id,
      autoHideDelay: 5000,
      ...defined,
    } as NotificationItem;

    this.notifications.push(newNotification);
    this.notifyListeners();

    if (newNotification.autoHideDelay && newNotification.autoHideDelay > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newNotification.autoHideDelay);
    }

    return id;
  }

  success(content: string, title?: string, autoHideDelay?: number) {
    return this.show({ notificationType: 'success', content, title, autoHideDelay });
  }

  error(content: string, title?: string, autoHideDelay?: number) {
    return this.show({ notificationType: 'failure', content, title, autoHideDelay });
  }

  warning(content: string, title?: string, autoHideDelay?: number) {
    return this.show({ notificationType: 'warning', content, title, autoHideDelay });
  }

  info(content: string, title?: string, autoHideDelay?: number) {
    return this.show({ notificationType: 'info', content, title, autoHideDelay });
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  clear() {
    this.notifications = [];
    this.notifyListeners();
  }

  subscribe(listener: (notifications: NotificationItem[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }
}

export const notificationService = new NotificationService();
