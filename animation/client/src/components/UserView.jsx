import { useState, useEffect } from "react";
import axios from "axios";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";

export default function UserView() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/tasks/my-tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        await axios.put(
          `http://localhost:3000/tasks/${editingTask.id}`,
          taskData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
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

  const openCreateForm = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const openEditForm = (task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  if (isLoading) return <div className="text-zinc-500">Loading your workspace...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">My Assigned Work</h2>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors"
        >
          + Assign Task
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length === 0 ? (
          <p className="text-zinc-500">You have no tasks assigned to you right now.</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={openEditForm}
              onDelete={handleDelete}
            />
          ))
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