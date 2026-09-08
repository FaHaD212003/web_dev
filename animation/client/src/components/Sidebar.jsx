import { Link, useLocation } from "react-router-dom";
import TextPressure from "./TextPressure";

export default function Sidebar({ role, onOpenCreateTask, theme = "dark" }) {
  const location = useLocation();

  const navItems =
    role === "admin"
      ? [
          { label: "Dashboard", to: "/dashboard" },
          { label: "Calendar", to: "/calendar" },
          { label: "Users", to: "/admin-users" },
          { label: "All Tasks", to: "/admin-tasks" },
          { label: "Notifications", to: "/notifications" },
        ]
      : [
          { label: "Calendar", to: "/calendar" },
          { label: "My Tasks", to: "/my-tasks" },
          { label: "Assigned Tasks", to: "/assigned-tasks" },
          { label: "Notifications", to: "/notifications" },
        ];

  return (
    <aside className="w-64 h-screen bg-white/95 dark:bg-[#060608]/95 border-r border-zinc-200 dark:border-zinc-800/80 text-zinc-900 dark:text-white p-5 flex flex-col fixed left-0 top-0 shadow-xl dark:shadow-2xl backdrop-blur-sm transition-colors duration-200 z-40">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-400 to-violet-500 flex items-center justify-center text-sm font-black shadow-lg shadow-cyan-500/20 shrink-0 text-white">
          T
        </div>

        <div style={{ position: "relative", height: "36px", width: "180px" }}>
          <TextPressure
            text={"Regulate."}
            flex
            alpha={false}
            stroke={false}
            width
            weight
            italic
            textColor={theme === "light" ? "#09090b" : "#ffffff"}
            strokeColor="#5227FF"
            minFontSize={24}
          />
        </div>
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
                  ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white shadow-inner"
                  : "bg-transparent border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-200 dark:hover:border-zinc-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={onOpenCreateTask}
        className="mt-auto mb-8 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black py-3 rounded-xl font-bold transition-all shadow-md shadow-zinc-900/10 dark:shadow-white/10"
      >
        + Create Task
      </button>
    </aside>
  );
}
