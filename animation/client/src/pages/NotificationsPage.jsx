import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Bell,
  CheckCheck,
  Trash2,
  ClipboardList,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Search,
  Clock,
  Filter,
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
    year: "numeric",
  });
};

const formatFullDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "task_due":
      return {
        icon: AlertTriangle,
        badgeClass: "bg-red-500/10 text-red-500 border-red-500/20",
        label: "Deadline Reached",
      };
    case "task_updated":
      return {
        icon: RefreshCw,
        badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        label: "Task Updated",
      };
    case "comment_created":
      return {
        icon: MessageSquare,
        badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        label: "New Comment",
      };
    case "comment_updated":
      return {
        icon: MessageSquare,
        badgeClass: "bg-violet-500/10 text-violet-500 border-violet-500/20",
        label: "Comment Edited",
      };
    case "task_assigned":
    default:
      return {
        icon: ClipboardList,
        badgeClass: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
        label: "Task Assigned",
      };
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread' | 'tasks' | 'comments'
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("http://localhost:3000/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Real-time Socket.IO listener for live notification updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const socket = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
    });

    const handleConnect = () => {
      socket.emit("user:join", currentUser.id);
    };

    if (socket.connected) handleConnect();
    socket.on("connect", handleConnect);

    socket.on("notification:new", (newNotif) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.emit("user:leave", currentUser.id);
      socket.disconnect();
    };
  }, [currentUser?.id]);

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
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleClearAll = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear all notifications?",
    );
    if (!confirmClear) return;

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

    if (notif.task_id) {
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

  // Filtered and Searched list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Tab filter
      if (filter === "unread" && notif.is_read) return false;
      if (
        filter === "tasks" &&
        !["task_assigned", "task_updated", "task_due"].includes(notif.type)
      ) {
        return false;
      }
      if (
        filter === "comments" &&
        !["comment_created", "comment_updated"].includes(notif.type)
      ) {
        return false;
      }

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = notif.title?.toLowerCase().includes(q);
        const matchMessage = notif.message?.toLowerCase().includes(q);
        return matchTitle || matchMessage;
      }

      return true;
    });
  }, [notifications, filter, searchQuery]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              All Notifications
            </h1>
            <span className="px-3 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-black text-zinc-800 dark:text-zinc-200">
              {notifications.length}
            </span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-black text-red-500">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Review activity, task assignments, updates, and discussions
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-cyan-600 dark:text-cyan-400 transition-colors shadow-sm"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark all as read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-sm">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "all", label: "All", count: notifications.length },
            { key: "unread", label: "Unread", count: unreadCount },
            {
              key: "tasks",
              label: "Tasks",
              count: notifications.filter((n) =>
                ["task_assigned", "task_updated", "task_due"].includes(n.type),
              ).length,
            },
            {
              key: "comments",
              label: "Comments",
              count: notifications.filter((n) =>
                ["comment_created", "comment_updated"].includes(n.type),
              ).length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                filter === tab.key
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  filter === tab.key
                    ? "bg-white/20 dark:bg-black/20 text-current"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
            <div className="h-7 w-7 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            <span className="text-sm font-semibold">
              Loading notification history...
            </span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-4">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
              No notifications found
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              {searchQuery
                ? `No notifications match your search query "${searchQuery}".`
                : filter === "unread"
                  ? "You have read all your notifications!"
                  : "You do not have any notifications in this section."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const iconInfo = getNotificationIcon(notif.type);
            const IconComponent = iconInfo.icon;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                  !notif.is_read
                    ? "bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06] border-cyan-500/30 hover:border-cyan-500/50"
                    : "bg-white dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                {/* Icon Badge */}
                <div
                  className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${iconInfo.badgeClass}`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-black text-zinc-900 dark:text-white">
                      {notif.title}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${iconInfo.badgeClass}`}
                    >
                      {iconInfo.label}
                    </span>
                    {!notif.is_read && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        Unread
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {notif.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-zinc-500">
                    <span
                      className="inline-flex items-center gap-1.5"
                      title={formatFullDate(notif.created_at)}
                    >
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      {formatRelativeTime(notif.created_at)}
                    </span>

                    {notif.task_id && (
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 group-hover:underline">
                        View Task #{notif.task_id} &rarr;
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions on Card */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(e, notif.id)}
                    title="Delete notification"
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors opacity-60 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
