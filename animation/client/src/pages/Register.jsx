import { useState, useEffect } from "react";
import axios from "axios";
import HalftoneReveal from "../components/HalftoneReveal";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginSuccess } from "../store/authSlice";
import Input from "../components/Input";
import SubmitButton from "../components/SubmitButton";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  axios.defaults.withCredentials = true;

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

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
        dispatch(loginSuccess(response.data.user));
        navigate("/home");
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
            <Input
              label={"confirm password"}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />

            <SubmitButton
              isLoading={isLoading}
              loadingText="Creating Account..."
            >Sign Up</SubmitButton>
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

      <div className="hidden lg:block lg:w-2/3 relative overflow-hidden bg-black">
        <HalftoneReveal
          src="https://picsum.photos/seed/register-reveal/1200/800"
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
