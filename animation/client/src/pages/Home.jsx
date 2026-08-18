import { useEffect, useState } from "react";
import axios from "axios";
import CircularGallery from "../components/CircularGallery";

export default function Home() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure axios sends the session cookie with every request
  axios.defaults.withCredentials = true;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Ping the backend to verify the session
        const response = await axios.get("http://localhost:3000/home");

        if (response.status === 200 && response.data.authenticated) {
          setUser(response.data.user);
        }
      } catch (err) {
        console.error("Authentication failed:", err);
        // If the server returns a 401 (Unauthorized), redirect to login
        window.location.href = "/login";
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      // Call the backend to destroy the session and clear the cookie
      await axios.post("http://localhost:3000/logout");
      window.location.href = "/login";
    } catch (err) {
      console.error("Error logging out", err);
    }
  };

  // Show a loading state while checking the session to prevent layout shift
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="animate-pulse text-xl font-semibold text-zinc-500">
          Loading environment...
        </div>
      </div>
    );
  }

  // If the user object is missing after loading, don't render the dashboard
  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      {/* Top Navigation Bar */}
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

      {/* Main Dashboard Content */}
      <main className="flex-1 flex flex-col w-full relative">
        {/* Welcome Header */}
        <div className="w-full max-w-7xl mx-auto px-8 py-12 pb-0 z-10">
          <h2 className="text-4xl font-bold text-white mb-2">Welcome back.</h2>
          <p className="text-zinc-400 text-lg">
            Your network analytics and assets are ready.
          </p>
        </div>

        {/* Circular Gallery Section */}
        <div className="flex-1 relative w-full flex items-center justify-center mt-[-40px]">
          {/* 
            The gallery container requires a fixed height. 
            Adjust this based on how large you want the 3D canvas to be.
          */}
          <div style={{ height: "600px", width: "100%", position: "relative" }}>
            <CircularGallery
              bend={1.5}
              textColor="#ffffff"
              borderRadius={0.05}
              scrollEase={0.05}
              font="bold 30px Orbitron"
              scrollSpeed={2.5}
              // If you updated your CircularGallery.jsx to accept an 'items' prop:
              // items={[
              //   "/gallery/asset-1.jpg",
              //   "/gallery/asset-2.jpg",
              //   "/gallery/asset-3.jpg"
              // ]}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
