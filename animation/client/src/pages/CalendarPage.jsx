import {
  Calendar as CalendarIcon,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../store/authSlice";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncStatusMsg, setSyncStatusMsg] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const user = useSelector(
    (state) =>
      state.auth.user || JSON.parse(localStorage.getItem("user")) || null,
  );
  const [users, setUsers] = useState([]);
  const [selectedUserID, setSelectedUserId] = useState("all");

  const isAdmin = user && user.role === "admin";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  
  useEffect(() => {
    const googleConnected = searchParams.get("google_connected");
    const token = searchParams.get("token");
    const rawUser = searchParams.get("user");

    if (googleConnected === "true") {
      if (token) {
        localStorage.setItem("token", token);
      }
      if (rawUser) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(rawUser));
          localStorage.setItem("user", JSON.stringify(parsedUser));
          dispatch(updateUser(parsedUser));
        } catch (e) {
          console.error("Failed to parse user from Google redirect:", e);
        }
      }
      setSyncStatusMsg("Google account successfully verified and connected!");
      navigate("/calendar", { replace: true });
    }
  }, [searchParams, dispatch, navigate]);

 
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/tasks/calendar", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTasks(response.data || []);
      setError("");
    } catch (err) {
      console.error("Failed to load tasks for calendar:", err);
      setError("Failed to load calendar tasks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);


  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:3000/users/employees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data || []);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  
  const handleConnectGoogle = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

 
  const handleSyncGoogleTasks = async () => {
    try {
      setIsSyncing(true);
      setSyncStatusMsg("");
      setError("");
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:3000/tasks/sync-google",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setSyncStatusMsg(res.data.message || "Tasks synchronized from Google!");
      fetchTasks();
    } catch (err) {
      console.error("Failed to sync Google tasks:", err);
      if (err.response?.data?.needAuth) {
        setError("Google session expired. Please verify with Google again.");
      } else {
        setError(
          err.response?.data?.message || "Failed to synchronize Google tasks.",
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // 6. Admin & User Filter Logic
  const filter = () => {
    if (isAdmin) {
      const filteredTasks =
        selectedUserID === "all"
          ? tasks
          : tasks.filter(
              (task) => Number(task.assignee_id) === Number(selectedUserID),
            );
      return filteredTasks;
    } else {
      const filteredTasks =
        selectedUserID === "all"
          ? tasks
          : tasks.filter(
              (task) =>
                Number(task.assignee_id) === Number(user?.id) ||
                Number(task.creator_id) === Number(user?.id),
            );
      return filteredTasks;
    }
  };

  // 7. Color Coding Logic
  const getTaskEventStyling = (task) => {
    const now = new Date();
    const dueDate = new Date(task.due_date);
    const isOverdue = dueDate < now && task.status !== "completed";

    if (isOverdue) {
      return {
        color: "#e00000",
        backgroundColor: "#e00000",
        borderColor: "#dc2626",
        textColor: "#ffffff",
      };
    }

    switch (task.status) {
      case "completed":
        return {
          color: "#00c583",
          backgroundColor: "#00c583",
          borderColor: "#059669",
          textColor: "#ffffff",
        };

      case "in_progress":
        return {
          color: "#3b82f6",
          backgroundColor: "#3b82f6",
          borderColor: "#2563eb",
          textColor: "#ffffff",
        };

      case "pending":
      default:
        return {
          color: "#f0c400",
          backgroundColor: "#f0c400",
          borderColor: "#ea580c",
          textColor: "#ffffff",
        };
    }
  };

  const calendarEvents = filter()
    .filter((task) => task.due_date)
    .map((task) => {
      const style = getTaskEventStyling(task);

      return {
        id: String(task.id),
        title: task.title,
        start: task.due_date,
        color: style.color,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        textColor: style.textColor,
        extendedProps: {
          status: task.status,
          description: task.description,
        },
      };
    });

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Task Calendar
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            View and manage all your scheduled tasks in real time
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isAdmin && (
            <div>
              {user?.is_google_user ? (
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleSyncGoogleTasks}
                  title="Sync with Google Calendar / Tasks"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-500 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all shadow-sm hover:shadow-emerald-500/10 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <img className="h-4 w-4" src="/google.png" alt="Google" />
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                      <span>Syncing Google Tasks...</span>
                    </>
                  ) : (
                    <>
                      <span>Sync with Google Calendar</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer active:scale-95"
                >
                  <img
                    className="h-4 w-4 bg-white rounded-full p-0.5"
                    src="/google.png"
                    alt="Google"
                  />
                  <span>Verify Google Account</span>
                </button>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="user-filter"
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400"
              >
                Filter by User:
              </label>
              <select
                id="user-filter"
                value={selectedUserID}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
              >
                <option value="all">All Users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {syncStatusMsg && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
          <button
            onClick={() => setSyncStatusMsg("")}
            className="text-xs hover:underline ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            className="text-xs hover:underline ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-2">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading calendar...</span>
        </div>
      ) : (
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            classicThemePlugin,
          ]}
          initialView="dayGridMonth"
          headerToolbar={{
            start: "today prev,next",
            center: "title",
            end: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={calendarEvents}
          dayMaxEvents={4}
          moreLinkClick="popover"
          eventClick={(info) => {
            if (info.event.id) {
              navigate(`/tasks/${info.event.id}`);
            }
          }}
          height="auto"
        />
      )}
    </div>
  );
}
