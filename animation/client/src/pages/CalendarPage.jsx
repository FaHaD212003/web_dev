import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import { useSelector } from "react-redux";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useSelector(
    (state) =>
      state.auth.user || JSON.parse(localStorage.getItem("user")) || null,
  );
  const [users, setUsers] = useState([]);
  const [selectedUserID, setSelectedUserId] = useState("all");

  const isAdmin = user && user.role === "admin";

  const navigate = useNavigate();

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
                Number(task.assignee_id) === Number(user.id) ||
                Number(task.creator_id) === Number(user.id),
            );
      return filteredTasks;
    }
  };

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
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Task Calendar
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            View and manage all your scheduled tasks in real time
          </p>
        </div>
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

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}
      <div className="mb-4 bg-blue-500/10 border border-blue-500/30 text-blue-500 p-3 rounded-xl text-xs font-bold">
      
      </div>

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
