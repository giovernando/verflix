import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationStore, Notification } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";

export const useNotifications = () => {
  const { user } = useAuthStore();
  const { notifications, unreadCount, setNotifications, addNotification, markAsRead } =
    useNotificationStore();

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(data as Notification[]);
    };

    fetchNotifications();

    // Subscribe to real-time additions
    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Real-time notification received!", payload);
          addNotification(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, setNotifications, addNotification]);

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    
    // Optimistic UI update
    markAsRead(id);
    
    // Backend update
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id);
      
    if (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return { notifications, unreadCount, handleMarkAsRead };
};
