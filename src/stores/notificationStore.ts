import { create } from "zustand";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set(() => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    })),
  addNotification: (notification) =>
    set((state) => {
      // Avoid duplicates
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }
      const newNotifications = [notification, ...state.notifications];
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter((n) => !n.is_read).length,
      };
    }),
  markAsRead: (id) =>
    set((state) => {
      const newNotifications = state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter((n) => !n.is_read).length,
      };
    }),
}));
