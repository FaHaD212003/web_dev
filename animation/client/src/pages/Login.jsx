import { useState, useEffect } from "react";
import axios from "axios";
import HalftoneReveal from "../components/HalftoneReveal";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginSuccess } from "../store/authSlice";
import Input from "../components/Input";
import SubmitButton from "../components/SubmitButton";

export default function Login() { 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (!token || !savedUser) return;

      try {
        const response = await axios.get("http://localhost:3000/home", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200 && response.data.authenticated && isMounted) {
          const user = response.data.user || JSON.parse(savedUser);
          localStorage.setItem("user", JSON.stringify(user));
          dispatch(loginSuccess(user));
          // Route dynamically based on role
          navigate(user.role === "admin" ? "/dashboard" : "/my-tasks", { replace: true });
        }
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    };

    if (isAuthenticated) {
      
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (savedUser) {
        navigate(savedUser.role === "admin" ? "/dashboard" : "/my-tasks", { replace: true });
      }
      return () => {
        isMounted = false;
      };
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate, dispatch]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post("http://localhost:3000/login", {
        username: email,
        password: password,
      });

      if (response.status === 200) {
        const user = response.data.user;
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(user));
        dispatch(loginSuccess(user));
        navigate(user.role === "admin" ? "/dashboard" : "/my-tasks", {
          replace: true,
        });
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (err.response && err.response.status === 403) {
        setError("Your account has been revoked. Please contact support.");
      }
      else {
        setError("Server error. Please try again later.");
      }
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <div className="flex flex-col justify-center w-full lg:w-1/3 p-12 bg-zinc-900 border-r border-zinc-800 z-10 shadow-2xl">
        <div className="max-w-sm w-full mx-auto">
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-white">
            Regulate.
          </h1>
          <p className="text-zinc-400 mb-8 font-medium tracking-wide">
            Access your dashboard.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label={"email"}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            
            <Input
              label={"password"}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <SubmitButton loadingText="Logging In...">Log In</SubmitButton>
            <div className=" text-right">
              <a
                href="/forgot-password"
                className="text-xs text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Forgot your password?
              </a>
            </div>
            <div className="mt-4 text-center">
              <a
                href="/register"
                className="text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Don't have an account? Create one here.
              </a>
            </div>
          </form>

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
              onClick={handleGoogleLogin}
              className="mt-6 w-full flex items-center justify-center gap-3 bg-zinc-950 border border-zinc-800 text-white font-semibold py-3 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google Logo"
                className="w-5 h-5"
              />
              Google
            </button>
          </div>
        </div>
      </div>

      <div className="group hidden lg:block lg:w-2/3 relative overflow-hidden bg-black">
        <HalftoneReveal
          src="https://picsum.photos/seed/halftone-reveal/1200/800"
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

        <div className="absolute bottom-12 left-12 pointer-events-none opacity-0 translate-y-4 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0">
          <h2 className="text-5xl font-bold text-white mb-2">
            Build the future.
          </h2>
          <p className="text-zinc-400 text-xl">
            Secure access to your environment.
          </p>
        </div>
      </div>
    </div>
  );
}
