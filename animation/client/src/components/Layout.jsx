import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutSuccess } from "../store/authSlice";
import Sidebar from "./Sidebar";

export default function Layout({ user }) {
  const [sidebarCreateTrigger, setSidebarCreateTrigger] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch(logoutSuccess());
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar
        role={user.role}
        onOpenCreateTask={() => setSidebarCreateTrigger(true)}
      />

      <div className="ml-64 flex-1 flex flex-col w-full relative bg-[radial-gradient(circle_at_top,_rgba(39,39,42,0.8),_transparent_35%),_#09090b]">
        <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <h1 className="text-md font-black tracking-tighter text-grey">
              Manage Your Tasks
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-sm font-medium text-zinc-400 hidden sm:block">
              Connected as <span className="text-white">{user.email}</span>
            </div>
            <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em]">
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-bold transition-colors"
            >
              Log Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 w-full max-w-7xl mx-auto">
          <Outlet context={{ sidebarCreateTrigger, setSidebarCreateTrigger }} />
        </main>
      </div>
    </div>
  );
}
