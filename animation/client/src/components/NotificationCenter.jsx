import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  ClipboardList,
  RefreshCw,
  AlertTriangle,
  Clock,
  Sparkles,
  MessageSquare,
} from "lucide-react";

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "task_due":
      return {
        icon: AlertTriangle,
        badgeClass: "bg-red-500/10 text-red-500 border-red-500/20",
      };
    case "task_updated":
      return {
        icon: RefreshCw,
        badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      };
    case "comment_created":
      return {
        icon: MessageSquare,
        badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      };
    case "comment_updated":
      return {
        icon: MessageSquare,
        badgeClass: "bg-violet-500/10 text-violet-500 border-violet-500/20",
      };
    case "task_assigned":
    default:
      return {
        icon: ClipboardList,
        badgeClass: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      };
  }
};

export default function NotificationCenter({ user, theme = "dark" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNewAlert, setHasNewAlert] = useState(false);

  const navigate = useNavigate();
  const popoverRef = useRef(null);
  const bellButtonRef = useRef(null);

  // Initial fetch of user notifications
  useEffect(() => {
    let isActive = true;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          "http://localhost:3000/notifications",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (isActive) {
          setNotifications(response.data.notifications || []);
          setUnreadCount(response.data.unreadCount || 0);
          setIsLoading(false);
        }
      } catch (err) {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchNotifications();

    return () => {
      isActive = false;
    };
  }, []);

  // WebSockets real-time sync for user notification room
  useEffect(() => {
    if (!user?.id) return;

    const socket = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
    });

    const handleConnect = () => {
      console.log(
        `[Socket Notification] Connected as user #${user.id}. Joining user_${user.id}`,
      );
      socket.emit("user:join", user.id);
    };

    if (socket.connected) {
      handleConnect();
    }
    socket.on("connect", handleConnect);

    // Listen for incoming real-time notifications
    socket.on("notification:new", (newNotif) => {
      console.log("[Socket Notification] Received new notification:", newNotif);
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
      setHasNewAlert(true);
      setTimeout(() => setHasNewAlert(false), 3000);

      // Trigger real-time re-render for affected task cards
      if (newNotif?.task_id) {
        window.dispatchEvent(
          new CustomEvent("task:due", { detail: { taskId: newNotif.task_id } }),
        );
      }
    });

    socket.on("task:due", (data) => {
      if (data?.taskId) {
        window.dispatchEvent(
          new CustomEvent("task:due", { detail: { taskId: data.taskId } }),
        );
      }
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.emit("user:leave", user.id);
      socket.disconnect();
    };
  }, [user?.id]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleTogglePopover = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        "http://localhost:3000/notifications/mark-all-read",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:3000/notifications/clear-all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read if not already
    if (!notif.is_read) {
      try {
        const token = localStorage.getItem("token");
        await axios.patch(
          `http://localhost:3000/notifications/${notif.id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );

        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    // Navigate to task detail if task_id exists
    if (notif.task_id) {
      setIsOpen(false);
      navigate(`/tasks/${notif.task_id}`);
    }
  };

  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/notifications/${notifId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const deletedNotif = notifications.find((n) => n.id === notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <>
      {/* Floating Bell Button at bottom right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          ref={bellButtonRef}
          type="button"
          onClick={handleTogglePopover}
          title="Notifications"
          className={`relative flex items-center justify-center w-14 h-14 rounded-full border shadow-2xl transition-all duration-300 transform active:scale-90 ${
            isOpen
              ? "bg-zinc-900 text-white dark:bg-white dark:text-black border-zinc-700 dark:border-white shadow-cyan-500/20"
              : "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800 hover:scale-105 hover:border-zinc-400 dark:hover:border-zinc-600"
          } ${hasNewAlert ? "animate-bounce" : ""}`}
        >
          <Bell
            className={`h-6 w-6 transition-transform ${
              hasNewAlert ? "rotate-12 text-amber-500" : ""
            }`}
          />

          {/* Red Dot / Unread Indicator Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-lg shadow-red-500/50 ring-2 ring-white dark:ring-black animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Flyout Popover Notification Center */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] max-h-[540px] flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-2xl shadow-2xl text-zinc-900 dark:text-white overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2.5">
              <span className="font-black text-base tracking-tight">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-extrabold text-red-500">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                  className="flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 px-2 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Read all</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[380px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                <div className="h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">
                  Loading updates...
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center text-zinc-500">
                <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                  You're all caught up!
                </p>
                <p className="text-xs text-zinc-500 mt-1 max-w-[220px]">
                  No new notifications right now. Any task assignments or
                  updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const iconInfo = getNotificationIcon(notif.type);
                const IconComponent = iconInfo.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 flex items-start gap-3 transition-colors cursor-pointer group hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${
                      !notif.is_read
                        ? "bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06]"
                        : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* Notification Type Icon */}
                    <div
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconInfo.badgeClass}`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>

                    {/* Notification Text Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black text-zinc-900 dark:text-white truncate">
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-zinc-400 whitespace-nowrap shrink-0 font-medium">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.task_id && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 group-hover:underline">
                          View task #{notif.task_id} &rarr;
                        </span>
                      )}
                    </div>

                    {/* Unread dot & Delete button */}
                    <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
                      {!notif.is_read && (
                        <span className="h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-cyan-500/20" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(e, notif.id)}
                        title="Delete notification"
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">
                {notifications.length} total notification
                {notifications.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-bold text-zinc-500 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
