import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { updateUser } from "../store/authSlice";
import { CheckCircle2, XCircle, Loader2, Calendar, ArrowRight } from "lucide-react";

export default function VerifyGooglePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [status, setStatus] = useState("verifying"); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token was provided in the link.");
      return;
    }

    let isMounted = true;

    const verifyToken = async () => {
      try {
        const response = await axios.post(
          "http://localhost:3000/auth/verify-google-token",
          { token }
        );

        if (isMounted) {
          setStatus("success");
          setMessage(response.data.message || "Google account verified successfully!");
          if (response.data.user) {
            dispatch(updateUser(response.data.user));
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus("error");
          setMessage(
            err.response?.data?.message ||
              "Verification link is invalid or has expired. Please try requesting a new link from the Calendar page."
          );
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token, dispatch]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center">
        {status === "verifying" && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-black text-white">Verifying Account...</h2>
            <p className="text-xs text-zinc-400 mt-2">
              Please wait while we confirm your Google account verification.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-4 animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Google Account Verified!
            </h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-sm">
              {message} You can now sync, manage, and view your tasks seamlessly in Google Calendar format.
            </p>

            <button
              type="button"
              onClick={() => navigate("/calendar")}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-white text-black hover:bg-zinc-200 font-black text-sm transition-all shadow-lg shadow-white/10 active:scale-95"
            >
              <Calendar className="h-4 w-4" />
              <span>Go to Calendar</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-4 animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/10">
              <XCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Verification Failed
            </h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              {message}
            </p>

            <div className="mt-6 w-full flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigate("/calendar")}
                className="w-full py-3 px-6 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all"
              >
                Back to Calendar
              </button>
              <Link
                to="/login"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
