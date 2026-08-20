import { useEffect, useState } from "react";
import axios from "axios";
import CircularGallery from "../components/CircularGallery";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginSuccess, logoutSuccess } from "../store/authSlice";
import TargetCursor from "../components/TargetCursor";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  axios.defaults.withCredentials = true;

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:3000/home");
        if (response.status === 200 && response.data.authenticated) {
          dispatch(loginSuccess(response.data.user));
        }
      } catch (err) {
        dispatch(logoutSuccess());
      } finally {
        setIsLoading(false);
      }useruser
    };user

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

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:3000/logout");
      dispatch(logoutSuccess());
      navigate("/login");
    } catch (err) {
      console.error("Error logging out", err);
    }
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
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>
    </div>


      <main className="flex-1 flex flex-col w-full relative">
        <div className="w-full max-w-7xl mx-auto px-8 py-12 pb-0 z-10">
          <h2 className="text-4xl font-bold text-white mb-2">Welcome back.</h2>
          <p className="text-zinc-400 text-lg">
            Your network analytics and assets are ready.
          </p>
        </div>

        <div className="flex-1 relative w-full flex items-center justify-center mt-[-40px]">
          <div style={{ height: "600px", width: "100%", position: "relative" }}>
            <CircularGallery
              bend={1.5}
              textColor="#ffffff"
              borderRadius={0.05}
              scrollEase={0.05}
              font="bold 30px Orbitron"
              scrollSpeed={2.5}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
