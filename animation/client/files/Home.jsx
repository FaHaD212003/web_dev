import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginSuccess, logoutSuccess } from "../store/authSlice";
import TargetCursor from "../components/TargetCursor";
import AdminView from "../components/AdminView";
import UserView from "../components/UserView";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        dispatch(logoutSuccess());
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get("http://localhost:3000/home", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200 && response.data.authenticated) {
          dispatch(loginSuccess(response.data.user));
        }
      } catch (err) {
        localStorage.removeItem("token");
        dispatch(logoutSuccess());
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthenticated) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(logoutSuccess());
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="animate-pulse text-xl font-semibold text-zinc-500">
          Loading environment...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      <div>
        <TargetCursor
          spinDuration={2}
          hideDefaultCursor
          parallaxOn
          hoverDuration={0.1}
          cursorColor="#ffffff"
          cursorColorOnTarget="#B497CF"
        />

        <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tighter">Regulate.</h1>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs font-medium text-zinc-400 border border-zinc-700 mt-1">
              v1.0
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm font-medium text-zinc-400 hidden sm:block">
              Connected as <span className="text-white">{user.email}</span>
            </div>
            <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs font-bold text-zinc-300 uppercase tracking-wide">
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold transition-colors"
            >
              Log Out
            </button>
          </div>
        </header>
      </div>

      <main className="flex-1 flex flex-col w-full relative max-w-7xl mx-auto px-8 py-12">
        {user.role === "admin" ? <AdminView /> : <UserView />}
      </main>
    </div>
  );
}
