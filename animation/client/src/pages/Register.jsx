import { useState } from "react";
import axios from "axios";
import HalftoneReveal from "../components/HalftoneReveal";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  axios.defaults.withCredentials = true;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match. Please try again.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/register", {
        username: email,
        password: password,
      });

      if (response.status === 201) {
        console.log("Registered user:", response.data.user);

        window.location.href = "/home";
      }
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError("An account with this email already exists.");
      } else {
        setError("Server error. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <div className="flex flex-col justify-center w-full lg:w-1/3 p-12 bg-zinc-900 border-r border-zinc-800 z-10 shadow-2xl overflow-y-auto">
        <div className="max-w-sm w-full mx-auto">
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-white">
            Regulate.
          </h1>
          <p className="text-zinc-400 mb-8 font-medium tracking-wide">
            Create your account.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all text-white placeholder-zinc-600"
                placeholder="hello@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-1">
                Password
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
                Confirm Password
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
              className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors shadow-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-zinc-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-white hover:underline font-semibold"
            >
              Log in
            </a>
          </p>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-900 text-zinc-500">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleRegister}
              className="mt-6 w-full flex items-center justify-center gap-3 bg-zinc-950 border border-zinc-800 text-white font-semibold py-3 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-2/3 relative overflow-hidden bg-black">
        <HalftoneReveal
          src="https://picsum.photos/seed/register-reveal/1200/800"
          inkColor="#141414"
          paperColor="#000000"
          mode="mono"
          dotDensity={90}
          angle={45}
          revealRadius={0.5}
          dotSize={1.2}
          shape="circle"
          contrast={1.2}
          invert={true}
          edge={0.8}
          follow={0.5}
          idleReveal={0}
          trigger="hover"
        />

        <div className="absolute bottom-12 left-12 pointer-events-none">
          <h2 className="text-5xl font-bold text-white mb-2">
            Join the network.
          </h2>
          <p className="text-zinc-400 text-xl">
            Establish your credentials today.
          </p>
        </div>
      </div>
    </div>
  );
}
