import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import axios from "axios";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";

export default function UserView() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [activeDropStatus, setActiveDropStatus] = useState("");
  const location = useLocation();

  const sentinelRef = useRef(null);

  // Catch the create event sent from Layout.jsx's Sidebar
  const { sidebarCreateTrigger, setSidebarCreateTrigger } = useOutletContext();

  const isAssignedTasksPage = location.pathname === "/assigned-tasks";

  const taskListConfig = {
    title: isAssignedTasksPage ? "Tasks I Assigned" : "My Assigned Work",
    emptyMessage: isAssignedTasksPage
      ? "You have not assigned any tasks to others yet."
      : "You have no tasks assigned to you right now.",
    loadingMessage: isAssignedTasksPage
      ? "Loading tasks you assigned..."
      : "Loading your workspace...",
    errorMessage: isAssignedTasksPage
      ? "Failed to load tasks you assigned."
      : "Failed to load your tasks.",
    endpoint: isAssignedTasksPage
      ? "http://localhost:3000/tasks/assigned-tasks"
      : "http://localhost:3000/tasks/my-tasks",
  };

  useEffect(() => {
    if (sidebarCreateTrigger) {
      setEditingTask(null);
      setIsFormOpen(true);
      setSidebarCreateTrigger(false);
    }
  }, [sidebarCreateTrigger, setSidebarCreateTrigger]);

  const fetchTasks = useCallback(
    async (pageNumber = 1, isReset = false) => {
      try {
        if (isReset) {
          setIsLoadingInitial(true);
        } else {
          setIsLoadingMore(true);
        }

        const token = localStorage.getItem("token");
        const response = await axios.get(taskListConfig.endpoint, {
          params: { page: pageNumber, limit: 12 },
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedTasks = Array.isArray(response.data)
          ? response.data
          : response.data.tasks || [];
        const serverHasMore = response.data.hasMore ?? false;
        const serverTotal = response.data.total ?? fetchedTasks.length;

        if (isReset) {
          setTasks(fetchedTasks);
        } else {
          setTasks((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const newUnique = fetchedTasks.filter((t) => !existingIds.has(t.id));
            return [...prev, ...newUnique];
          });
        }

        setPage(pageNumber);
        setHasMore(serverHasMore);
        setTotalTasks(serverTotal);
        setError("");
      } catch (err) {
        setError(taskListConfig.errorMessage);
      } finally {
        if (isReset) {
          setIsLoadingInitial(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    },
    [taskListConfig.endpoint, taskListConfig.errorMessage],
  );

  useEffect(() => {
    fetchTasks(1, true);
  }, [location.pathname, fetchTasks]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!hasMore || isLoadingInitial || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchTasks(page + 1, false);
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isLoadingInitial, isLoadingMore, page, fetchTasks]);

  const handleDelete = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
      setTotalTasks((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError("Failed to delete task. You might not have permission.");
    }
  };

  const handleFormSubmit = async (taskData) => {
    try {
      const token = localStorage.getItem("token");
      if (editingTask) {
        const response = await axios.put(
          `http://localhost:3000/tasks/${editingTask.id}`,
          taskData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? response.data : t)),
        );
      } else {
        await axios.post("http://localhost:3000/tasks", taskData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchTasks(1, true);
      }
      setIsFormOpen(false);
      setEditingTask(null);
    } catch (err) {
      setError("Failed to save task.");
    }
  };

  const openEditForm = (task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const updateTaskStatus = async (task, status) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(
      `http://localhost:3000/tasks/${task.id}`,
      {
        title: task.title,
        description: task.description,
        status,
        assignee_id: task.assignee_id,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return response.data;
  };

  const handleDragStart = (task) => {
    setDraggedTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setActiveDropStatus("");
  };

  const handleDragOver = (event, statusKey) => {
    event.preventDefault();
    setActiveDropStatus(statusKey);
  };

  const handleDrop = async (event, statusKey) => {
    event.preventDefault();
    setActiveDropStatus("");

    const task = tasks.find((currentTask) => currentTask.id === draggedTaskId);

    if (!task || task.status === statusKey) {
      setDraggedTaskId(null);
      return;
    }

    try {
      const updatedTask = await updateTaskStatus(task, statusKey);
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === updatedTask.id ? updatedTask : currentTask,
        ),
      );
    } catch (err) {
      setError("Failed to update task status.");
    } finally {
      setDraggedTaskId(null);
    }
  };

  // Groups tasks into specific colored columns
  const renderColumn = (title, statusKey, accentBorder) => {
    const filteredTasks = tasks.filter((t) => t.status === statusKey);
    return (
      <div
        onDragOver={(event) => handleDragOver(event, statusKey)}
        onDrop={(event) => handleDrop(event, statusKey)}
        className={`flex flex-col gap-4 bg-zinc-900/60 border-t-4 ${accentBorder} border border-zinc-800 rounded-xl p-4 min-h-[550px] transition-colors ${
          activeDropStatus === statusKey ? "bg-zinc-900 border-zinc-700" : ""
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg text-white">{title}</h3>
          <span className="text-xs font-semibold bg-zinc-800 px-2 py-1 rounded text-zinc-400">
            {filteredTasks.length}
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={openEditForm}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>
    );
  };

  const { title, emptyMessage, loadingMessage } = taskListConfig;

  if (isLoadingInitial) {
    return (
      <div className="flex h-72 items-center justify-center text-zinc-500">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="h-5 w-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          {loadingMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
          <p className="text-xs text-zinc-400">
            Showing {tasks.length} of {totalTasks} tasks
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* 3-Column Status Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderColumn("Pending", "pending", "border-amber-500")}
        {renderColumn("In Progress", "in_progress", "border-blue-500")}
        {renderColumn("Completed", "completed", "border-emerald-500")}
      </div>

      {tasks.length === 0 && <p className="text-zinc-500 text-sm mt-4">{emptyMessage}</p>}

      {/* Infinite Scroll Sentinel & Indicators */}
      <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 py-3">
            <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            Loading more tasks...
          </div>
        )}
        {!hasMore && tasks.length > 0 && (
          <p className="text-xs text-zinc-500 font-medium py-2">
            All {totalTasks} tasks loaded
          </p>
        )}
      </div>

      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
      />
    </div>
  );
}
