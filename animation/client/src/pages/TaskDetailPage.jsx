import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { io } from "socket.io-client";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  UserCheck,
  Send,
  Edit3,
  Trash2,
  Check,
  X,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Paperclip,
  FileText,
  Download,
} from "lucide-react";

const statusConfig = {
  pending: {
    label: "Pending",
    color: "amber",
    badgeClass: "bg-amber-950/60 text-amber-400 border-amber-800/60",
    icon: Clock3,
  },
  in_progress: {
    label: "In Progress",
    color: "blue",
    badgeClass: "bg-blue-950/60 text-blue-400 border-blue-800/60",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    color: "emerald",
    badgeClass: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    icon: CheckCircle2,
  },
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
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

const formatTimeOnly = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const fileInputRef = useRef(null);
  const commentsEndRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    commentsEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);

    const handleTaskDue = (e) => {
      if (!e.detail?.taskId || String(e.detail.taskId) === String(id)) {
        setNow(Date.now());
      }
    };

    window.addEventListener("task:due", handleTaskDue);

    return () => {
      clearInterval(timer);
      window.removeEventListener("task:due", handleTaskDue);
    };
  }, [id]);

  useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const token = localStorage.getItem("token");

        const [taskRes, commentsRes] = await Promise.all([
          axios.get(`http://localhost:3000/tasks/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:3000/tasks/${id}/comments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (isActive) {
          setTask(taskRes.data);
          setComments(commentsRes.data || []);
        }
      } catch (err) {
        if (isActive) {
          setError(
            err.response?.data?.message || "Failed to load task details.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isActive = false;
    };
  }, [id]);

  // Real-Time Socket.IO comments synchronization
  useEffect(() => {
    if (!id) return;

    const socket = io("http://localhost:3000");

    // Join room for this specific task
    socket.emit("task:join", id);

    // Listen for new comments created by any user
    socket.on("comment:created", (incomingComment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === incomingComment.id)) {
          return prev;
        }
        return [...prev, incomingComment];
      });
      setTimeout(() => scrollToBottom(true), 100);
    });

    // Listen for comment updates
    socket.on("comment:updated", (updatedComment) => {
      setComments((prev) =>
        prev.map((c) => (c.id === updatedComment.id ? updatedComment : c)),
      );
    });

    // Listen for comment deletions
    socket.on("comment:deleted", ({ commentId }) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });

    return () => {
      socket.emit("task:leave", id);
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (!isLoading && comments.length > 0) {
      scrollToBottom(false);
    }
  }, [isLoading]);

  // Handle Quick Status Update
  const handleStatusChange = async (newStatus) => {
    if (!task || task.status === newStatus || isUpdatingStatus) return;

    try {
      setIsUpdatingStatus(true);
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:3000/tasks/${task.id}`,
        {
          title: task.title,
          description: task.description,
          status: newStatus,
          assignee_id: task.assignee_id,
          due_date: task.due_date,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setTask((prev) => ({
        ...prev,
        status: response.data.status,
        updated_at: response.data.updated_at,
        due_date: response.data.due_date,
      }));
    } catch (err) {
      console.error("Failed to update task status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setUploadError("File size exceeds 25 MB limit.");
      setTimeout(() => setUploadError(""), 4000);
      return;
    }

    setUploadError("");
    setSelectedFile(file);
  };

  const handlePostComment = async (e) => {
    if (e) e.preventDefault();
    if ((!newComment.trim() && !selectedFile) || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      setUploadError("");
      const token = localStorage.getItem("token");

      const formData = new FormData();
      if (newComment.trim()) {
        formData.append("content", newComment.trim());
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await axios.post(
        `http://localhost:3000/tasks/${id}/comments`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setComments((prev) => {
        if (prev.some((c) => c.id === response.data.id)) return prev;
        return [...prev, response.data];
      });

      setNewComment("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setTimeout(() => scrollToBottom(true), 100);
    } catch (err) {
      console.error("Failed to post comment:", err);
      setUploadError(
        err.response?.data?.message || "Failed to post comment or file.",
      );
      setTimeout(() => setUploadError(""), 5000);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle Start Edit Comment
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content || "");
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  // Handle Save Edit Comment
  const handleSaveEdit = async (commentId) => {
    if (!editingContent.trim() || isUpdatingComment) return;

    try {
      setIsUpdatingComment(true);
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:3000/tasks/${id}/comments/${commentId}`,
        { content: editingContent.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? response.data : c)),
      );
      setEditingCommentId(null);
      setEditingContent("");
    } catch (err) {
      console.error("Failed to update comment:", err);
    } finally {
      setIsUpdatingComment(false);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this comment?",
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:3000/tasks/${id}/comments/${commentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  // Handle keydown in textarea
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePostComment();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-zinc-500">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold">Loading task details...</span>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-300 max-w-md">
          <p className="font-bold text-lg mb-2">Error Loading Task</p>
          <p className="text-sm text-zinc-400">{error || "Task not found."}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    );
  }

  const currentStatusInfo = statusConfig[task.status] || statusConfig.pending;
  const StatusIcon = currentStatusInfo.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tasks
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider hidden sm:inline">
            Status:
          </span>
          <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-1 shadow-sm">
            {Object.keys(statusConfig).map((key) => {
              const item = statusConfig[key];
              const isSelected = task.status === key;
              return (
                <button
                  key={key}
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? `${item.badgeClass} shadow-inner`
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: Task Details ================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Main Info Card */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6 shadow-sm dark:shadow-2xl flex flex-col gap-5 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${currentStatusInfo.badgeClass}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {currentStatusInfo.label}
                </span>
                <span className="text-xs text-zinc-500 font-bold tracking-widest uppercase">
                  Task #{task.id}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mt-1 leading-tight">
                {task.title}
              </h1>
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-2">
                Description
              </p>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 p-4 text-sm text-zinc-800 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap min-h-[90px]">
                {task.description || (
                  <span className="italic text-zinc-400 dark:text-zinc-600">
                    No description provided for this task.
                  </span>
                )}
              </div>
            </div>

            {/* People Involved */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <UserCheck className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                    Assigned To
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                     {task.assignee_email || "User #" + task.assignee_id}
                      : task.assignee_email ||
                        `User #${task.assignee_id || "Unassigned"}`
                  </p>
                  <span className="text-[11px] text-zinc-500 font-medium">
                    ID: {task.assignee_id || "None"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <User className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                    Created By
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                     {task.creator_email || "User #" + task.creator_id}
                      : task.creator_email || `User #{task.creator_id}
                  </p>
                  <span className="text-[11px] text-zinc-500 font-medium">
                    ID: {task.creator_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Dates & Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-zinc-200 dark:border-zinc-800/60">
              <div className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 pt-2">
                <Calendar className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block">
                    Created
                  </span>
                  <span>{formatDate(task.created_at)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 pt-2">
                <Clock className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block">
                    Last Updated
                  </span>
                  <span>{formatDate(task.updated_at)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 pt-2">
                <Clock
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    task.due_date &&
                    new Date(task.due_date) < new Date() &&
                    new Date(task.due_date).getTime() <= now &&
                    task.status !== "completed"
                      ? "text-red-500"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                />
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block">
                    Due Date & Time
                  </span>
                  <span
                    className={
                      task.due_date &&
                      new Date(task.due_date) < new Date() &&
                      new Date(task.due_date).getTime() <= now &&
                      task.status !== "completed"
                        ? "text-red-500 font-semibold"
                        : ""
                    }
                  >
                    {task.due_date ? formatDate(task.due_date) : "None"}
                    {task.due_date &&
                      new Date(task.due_date).getTime() <= now &&
                      task.status !== "completed" && (
                        <span className="text-[9px] uppercase tracking-wider text-red-500 ml-1.5 font-bold">
                          (Overdue)
                        </span>
                      )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Comments & Discussion ================= */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-sm dark:shadow-2xl h-[680px] overflow-hidden transition-colors">
          {/* Comments Header */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400 flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Discussion & Notes
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Collaborate and add updates about this task
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </span>
          </div>

          {/* WhatsApp-Style Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-zinc-50/40 dark:bg-zinc-950/40">
            {comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-600 mb-3">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-400">
                  No comments yet
                </p>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Be the first to share an update, progress note, or attachment
                  about this task.
                </p>
              </div>
            ) : (
              comments.map((comment) => {
                const isAuthor =
                  currentUser &&
                  (comment.user_id === currentUser.id ||
                    comment.user_email === currentUser.email);
                const isEditing = editingCommentId === comment.id;
                const isEdited =
                  comment.updated_at &&
                  comment.created_at &&
                  new Date(comment.updated_at).getTime() -
                    new Date(comment.created_at).getTime() >
                    1000;

                return (
                  <div
                    key={comment.id}
                    className={`flex flex-col ${
                      isAuthor ? "items-end" : "items-start"
                    } group`}
                  >
                    {/* Author & Timestamp Header */}
                    <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {isAuthor ? "You" : comment.user_email}
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-600">
                        •
                      </span>
                      <span className="text-zinc-500">
                        {formatTimeOnly(comment.created_at)}
                      </span>
                      {isEdited && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                          (edited)
                        </span>
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`relative max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-sm dark:shadow-md ${
                        isAuthor
                          ? "bg-cyan-50 dark:bg-zinc-900 border border-cyan-200 dark:border-cyan-500/20 text-zinc-900 dark:text-zinc-100 rounded-tr-sm"
                          : "bg-white dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm"
                      }`}
                    >
                      {isEditing ? (
                        /* In-Place Editing View */
                        <div className="flex flex-col gap-2 min-w-[280px]">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={3}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-cyan-500 resize-none"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={isUpdatingComment}
                              className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors inline-flex items-center gap-1"
                            >
                              <X className="h-3 w-3" /> Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={
                                isUpdatingComment || !editingContent.trim()
                              }
                              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check className="h-3 w-3" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal Comment Bubble */
                        <div className="flex flex-col gap-2">
                          {comment.content && (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {comment.content}
                            </p>
                          )}

                          {/* File / Image Attachment */}
                          {comment.file_url && (
                            <div className="mt-1">
                              {comment.file_type?.startsWith("image/") ? (
                                <div className="relative group/media overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/80 max-w-sm">
                                  <a
                                    href={comment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block overflow-hidden"
                                  >
                                    <img
                                      src={comment.file_url}
                                      alt={comment.file_name || "Attachment"}
                                      className="max-h-60 w-auto max-w-full rounded-xl object-contain hover:scale-[1.02] transition-transform duration-200"
                                      loading="lazy"
                                    />
                                  </a>
                                  <div className="flex items-center justify-between gap-2 p-2 bg-zinc-900/85 backdrop-blur-sm text-white text-[11px]">
                                    <span
                                      className="truncate max-w-[160px] font-medium"
                                      title={comment.file_name}
                                    >
                                      {comment.file_name}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {comment.file_size && (
                                        <span className="text-zinc-400 text-[10px]">
                                          {formatFileSize(comment.file_size)}
                                        </span>
                                      )}
                                      <a
                                        href={comment.file_url}
                                        download={comment.file_name || "image"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded hover:bg-white/20 text-zinc-200 hover:text-white transition-colors"
                                        title="Download image"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors max-w-sm">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                                      <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <p
                                        className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                                        title={comment.file_name}
                                      >
                                        {comment.file_name || "Attachment"}
                                      </p>
                                      <p className="text-[10px] text-zinc-500">
                                        {formatFileSize(comment.file_size)}
                                      </p>
                                    </div>
                                  </div>
                                  <a
                                    href={comment.file_url}
                                    download={comment.file_name || "file"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-cyan-500 hover:text-black dark:hover:bg-cyan-500 dark:hover:text-black text-zinc-700 dark:text-zinc-300 transition-colors shrink-0"
                                    title="Download attachment"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons: Only for Comment Author */}
                          {isAuthor && (
                            <div className="flex items-center justify-end gap-2 pt-1 mt-0.5 border-t border-zinc-200/60 dark:border-zinc-700/40 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleStartEdit(comment)}
                                className="text-zinc-500 hover:text-cyan-600 dark:text-zinc-400 dark:hover:text-cyan-400 transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700/40 text-[11px] inline-flex items-center gap-1"
                                title="Edit comment"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700/40 text-[11px] inline-flex items-center gap-1"
                                title="Delete comment"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Bottom Chat Compose Input Bar */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/80 flex flex-col gap-2">
            {/* Error Message if file too large or upload fails */}
            {uploadError && (
              <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Selected File Preview Chip */}
            {selectedFile && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
                  <span className="font-semibold truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-1 rounded-full hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 transition-colors shrink-0"
                  title="Remove attached file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handlePostComment} className="flex items-end gap-2">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Attach Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmittingComment}
                className="h-[46px] w-[46px] rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-cyan-500 dark:hover:text-cyan-400 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50 shadow-sm"
                title="Attach file or image"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              {/* Text Area */}
              <div className="flex-1 relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedFile
                      ? "Add a comment with your file... (optional)"
                      : "Write a comment... (Press Enter to send)"
                  }
                  rows={1}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-cyan-500 resize-none min-h-[46px] max-h-[120px] transition-colors shadow-sm"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isSubmittingComment || (!newComment.trim() && !selectedFile)
                }
                className="h-[46px] px-5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0"
              >
                {isSubmittingComment ? (
                  <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
