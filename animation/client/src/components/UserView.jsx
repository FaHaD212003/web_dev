import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";

export default function UserView() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Catch the create event sent from Layout.jsx's Sidebar
  const { sidebarCreateTrigger, setSidebarCreateTrigger } = useOutletContext();

  useEffect(() => {
    if (sidebarCreateTrigger) {
      setEditingTask(null);
      setIsFormOpen(true);
      setSidebarCreateTrigger(false);
    }
  }, [sidebarCreateTrigger, setSidebarCreateTrigger]);

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/tasks/my-tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (err) {
      setError("Failed to load your tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const handleDelete = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (err) {
      setError("Failed to delete task. You might not have permission.");
    }
  };

  const handleFormSubmit = async (taskData) => {
    try {
      const token = localStorage.getItem("token");
      if (editingTask) {
        await axios.put(`http://localhost:3000/tasks/${editingTask.id}`, taskData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("http://localhost:3000/tasks", taskData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setIsFormOpen(false);
      setEditingTask(null);
      fetchMyTasks();
    } catch (err) {
      setError("Failed to save task.");
    }
  };

  const openEditForm = (task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // Groups tasks into specific colored columns
  const renderColumn = (title, statusKey, accentBorder) => {
    const filteredTasks = tasks.filter((t) => t.status === statusKey);
    return (
      <div className={`flex flex-col gap-4 bg-zinc-900/60 border-t-4 ${accentBorder} border border-zinc-800 rounded-xl p-4 min-h-[550px]`}>
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
            />
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="text-zinc-500">Loading your workspace...</div>;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-white mb-2">My Assigned Work</h2>

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