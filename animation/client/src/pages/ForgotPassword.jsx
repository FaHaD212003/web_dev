import { useState } from "react";
import axios from "axios";
import HalftoneReveal from "../components/HalftoneReveal";
import Input from "../components/Input";
import SubmitButton from "../components/SubmitButton";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/forgot-password",
        {
          username: email,
        },
      );

      if (response.status === 200 || response.status === 201) {
        setMessage(
          "If an account with that email exists, a password reset link has been sent.",
        );
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
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
            Reset your password.
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={"email"}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <SubmitButton
              isLoading={isLoading}
              loadingText="Sending Reset Link..."
            >
              Send Reset Link
            </SubmitButton>
          </form>

          <p className="mt-6 text-sm text-center text-zinc-500">
            Remembered your password?{" "}
            <a
              href="/login"
              className="text-white hover:underline font-semibold"
            >
              Log in
            </a>
          </p>
        </div>
      </div>

      <div className="hidden lg:block lg:w-2/3 relative overflow-hidden bg-black">
        <HalftoneReveal
          src="https://picsum.photos/seed/forgot-reveal/1200/800"
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
      </div>
    </div>
  );
}