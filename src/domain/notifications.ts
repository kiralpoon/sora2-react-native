export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationCenterState {
  items: NotificationItem[];
}

export function createNotificationCenter(initialItems: NotificationItem[] = []): NotificationCenterState {
  return { items: [...initialItems].sort(descendingByCreatedAt) };
}

export function pushNotification(state: NotificationCenterState, item: NotificationItem): NotificationCenterState {
  return { items: [item, ...state.items].sort(descendingByCreatedAt) };
}

export function markAsRead(state: NotificationCenterState, notificationId: string, timestamp: string): NotificationCenterState {
  return {
    items: state.items.map((item) =>
      item.id === notificationId ? { ...item, readAt: timestamp } : item
    ),
  };
}

export function dismissNotification(state: NotificationCenterState, notificationId: string): NotificationCenterState {
  return { items: state.items.filter((item) => item.id !== notificationId) };
}

export function selectUnread(state: NotificationCenterState): NotificationItem[] {
  return state.items.filter((item) => !item.readAt);
}

function descendingByCreatedAt(a: NotificationItem, b: NotificationItem): number {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}
