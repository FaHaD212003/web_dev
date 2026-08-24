import { useState, useEffect } from "react";
import axios from "axios";
import TaskCard from "./TaskCard";

export default function AdminView() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/tasks", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTasks(response.data);
      } catch (err) {
        setError("Failed to load system tasks.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTasks();
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
      setError("Failed to delete task.");
    }
  };

  const handleEdit = (task) => {
    console.log("Edit task:", task);
  };

  if (isLoading) return <div className="text-zinc-500">Loading master task list...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Global Task Overview</h2>
        <button className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors">
          + Create New Task
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length === 0 ? (
          <p className="text-zinc-500">No tasks currently exist in the system.</p>
        ) : (
          tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}