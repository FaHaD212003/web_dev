import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutSuccess } from "../store/authSlice";
import { Sun, Moon } from "lucide-react";
import Sidebar from "./Sidebar";
import TextType from "./TextType";
import NotificationCenter from "./NotificationCenter";

export default function Layout({ user }) {
  const [sidebarCreateTrigger, setSidebarCreateTrigger] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch(logoutSuccess());
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-black text-zinc-900 dark:text-white font-sans transition-colors duration-200">
      <Sidebar
        role={user.role}
        theme={theme}
        onOpenCreateTask={() => setSidebarCreateTrigger(true)}
      />

      <div className="ml-64 flex-1 flex flex-col w-full relative bg-zinc-100 dark:bg-[#050505] text-zinc-900 dark:text-white transition-colors duration-200 min-h-screen">
        <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-[#08080a]/90 backdrop-blur-xl sticky top-0 z-30 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <TextType
              className="text-zinc-800 dark:text-zinc-200 font-medium text-sm"
              text={[
                "Manage your tasks efficiently",
                "Stay organized and productive",
                "Welcome to your task management dashboard",
              ]}
              typingSpeed={75}
              pauseDuration={1500}
              showCursor
              cursorCharacter="_"
              deletingSpeed={50}
              variableSpeedEnabled={false}
              variableSpeedMin={60}
              variableSpeedMax={120}
              cursorBlinkDuration={0.5}
            />
          </div>

          <div className="flex items-center gap-4 sm:gap-5">
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Connected as{" "}
              <span className="text-zinc-900 dark:text-white font-semibold">
                {user.email}
              </span>
            </div>
            <span className="px-3 py-1 bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-full text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-[0.2em]">
              {user.role}
            </span>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle theme"
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm group"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform duration-200" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-200" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg text-sm font-bold transition-colors"
            >
              Log Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 w-full max-w-7xl mx-auto">
          <Outlet
            context={{ sidebarCreateTrigger, setSidebarCreateTrigger, theme }}
          />
        </main>
      </div>

      {/* Floating Real-Time Notifications Center */}
      <NotificationCenter user={user} theme={theme} />
    </div>
  );
}
