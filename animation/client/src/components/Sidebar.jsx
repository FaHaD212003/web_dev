import { Link } from "react-router-dom";

export default function Sidebar({ role, onOpenCreateTask }) {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col fixed left-0 top-0">
      <h2 className="text-2xl font-bold mb-8">TaskApp</h2>
      
      <nav className="flex flex-col gap-4 flex-grow">
        {role === "admin" ? (
          <>
            <Link to="/dashboard" className="hover:text-blue-400">Dashboard</Link>
            <Link to="/admin-tasks" className="hover:text-blue-400">All Tasks</Link>
          </>
        ) : (
          <>
            <Link to="/my-tasks" className="hover:text-blue-400">My Tasks</Link>
            <Link to="/assigned-tasks" className="hover:text-blue-400">Assigned Tasks</Link>
          </>
        )}
      </nav>

      <button 
        onClick={onOpenCreateTask} 
        className="mt-auto bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold"
      >
        + Create Task
      </button>
    </aside>
  );
}