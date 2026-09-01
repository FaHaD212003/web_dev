import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";

export default function AdminView() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [activeDropStatus, setActiveDropStatus] = useState("");

  const { sidebarCreateTrigger, setSidebarCreateTrigger } = useOutletContext();

  useEffect(() => {
    if (sidebarCreateTrigger) {
      setEditingTask(null);
      setIsFormOpen(true);
      setSidebarCreateTrigger(false);
    }
  }, [sidebarCreateTrigger, setSidebarCreateTrigger]);

  const fetchAllTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (err) {
      setError("Failed to load system tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const handleDelete = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (err) {
      setError("Failed to delete task.");
    }
  };

  const handleFormSubmit = async (taskData) => {
    try {
      const token = localStorage.getItem("token");
      if (editingTask) {
        await axios.put(
          `http://localhost:3000/tasks/${editingTask.id}`,
          taskData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        await axios.post("http://localhost:3000/tasks", taskData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setIsFormOpen(false);
      setEditingTask(null);
      fetchAllTasks();
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
        <div className="flex flex-col gap-4 overflow-y-auto">
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

  if (isLoading)
    return <div className="text-zinc-500">Loading master task list...</div>;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-white">Global Task Overview</h2>

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

      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
      />
    </div>
  );
}
