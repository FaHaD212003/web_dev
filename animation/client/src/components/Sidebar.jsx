import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ role, onOpenCreateTask }) {
  const location = useLocation();

  const navItems =
    role === "admin"
      ? [
          { label: "Dashboard", to: "/dashboard" },
          { label: "Users", to: "/admin-users" },
          { label: "All Tasks", to: "/admin-tasks" },
        ]
      : [
          { label: "My Tasks", to: "/my-tasks" },
          { label: "Assigned Tasks", to: "/assigned-tasks" },
        ];

  return (
    <aside className="w-64 h-screen bg-zinc-950/95 border-r border-zinc-800 text-white p-5 flex flex-col fixed left-0 top-0 shadow-2xl backdrop-blur-sm">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-400 to-violet-500 flex items-center justify-center text-sm font-black shadow-lg shadow-cyan-500/20">
          T
        </div>
        <h2 className="text-2xl font-black tracking-tighter">TaskApp</h2>
      </div>

      <nav className="flex flex-col gap-3 flex-grow">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-xl px-3 py-3 text-sm font-semibold transition-all border ${
                isActive
                  ? "bg-zinc-800 border-zinc-700 text-white shadow-inner shadow-zinc-900"
                  : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={onOpenCreateTask}
        className="mt-auto bg-white hover:bg-zinc-200 text-black py-3 rounded-xl font-bold transition-colors shadow-lg shadow-white/10"
      >
        + Create Task
      </button>
    </aside>
  );
}
