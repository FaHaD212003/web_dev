import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import HalftoneReveal from "../components/HalftoneReveal";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  axios.defaults.withCredentials = true;

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setIsLoading(true);

    try {
      
      const response = await axios.post(
        `http://localhost:3000/reset-password/${token}`,
        {
          password: password,
        },
      );

      if (response.status === 200 || response.status === 201) {
        setMessage("Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2500);
      }
    } catch (err) {
      setError("Password reset link is invalid or has expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <div className="flex flex-col justify-center w-full lg:w-1/3 p-12 bg-zinc-900 border-r border-zinc-800 z-10 shadow-2xl">
        <div className="max-w-sm w-full mx-auto">
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-white">
            Regulate.
          </h1>
          <p className="text-zinc-400 mb-8 font-medium tracking-wide">
            Enter your new password.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-md mb-6 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all text-white placeholder-zinc-600"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all text-white placeholder-zinc-600"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors shadow-lg mt-2 disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden lg:block lg:w-2/3 relative overflow-hidden bg-black">
        <HalftoneReveal
          src="https://picsum.photos/seed/reset-reveal/1200/800"
          inkColor="#141414"
          paperColor="#000000"
          mode="mono"
          dotDensity={90}
          angle={45}
          revealRadius={0.4}
          dotSize={1.2}
          shape="circle"
          contrast={1.2}
          invert={true}
          edge={0.8}
          follow={0.5}
          idleReveal={0}
          trigger="hover"
        />
      </div>
    </div>
  );
}
