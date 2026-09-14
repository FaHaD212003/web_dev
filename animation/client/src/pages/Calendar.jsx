import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import classicThemePlugin from "@fullcalendar/react/themes/classic";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
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

  // Format tasks for FullCalendar
  const calendarEvents = tasks
    .filter((task) => task.due_date)
    .map((task) => {
      let bg = "#f59e0b"; // pending = amber
      if (task.status === "completed") bg = "#10b981"; // emerald
      if (task.status === "in_progress") bg = "#3b82f6"; // blue

      return {
        id: String(task.id),
        title: task.title,
        start: task.due_date,
        backgroundColor: bg,
        borderColor: "transparent",
        textColor: "#ffffff",
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
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-xl text-xs font-bold">
          {error}
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
