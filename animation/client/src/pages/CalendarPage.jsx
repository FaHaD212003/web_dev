import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Users,
  Search,
  X,
  ExternalLink,
  Download,
  Mail,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";

// Days of week
const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Helper: Format hour for time-grid (0 -> 12 AM, 13 -> 1 PM)
const formatHourLabel = (hour) => {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
};

// Helper: Get status styles for task pills and cards
const getStatusStyles = (status, isOverdue = false) => {
  if (isOverdue && status !== "completed") {
    return {
      bg: "bg-red-500/15 dark:bg-red-950/40",
      border: "border-red-500/30",
      text: "text-red-700 dark:text-red-300",
      dot: "bg-red-500",
      accent: "bg-red-500",
    };
  }
  switch (status) {
    case "completed":
      return {
        bg: "bg-emerald-500/15 dark:bg-emerald-950/40",
        border: "border-emerald-500/30",
        text: "text-emerald-700 dark:text-emerald-300",
        dot: "bg-emerald-500",
        accent: "bg-emerald-500",
      };
    case "in_progress":
      return {
        bg: "bg-blue-500/15 dark:bg-blue-950/40",
        border: "border-blue-500/30",
        text: "text-blue-700 dark:text-blue-300",
        dot: "bg-blue-500",
        accent: "bg-blue-500",
      };
    case "pending":
    default:
      return {
        bg: "bg-amber-500/15 dark:bg-amber-950/40",
        border: "border-amber-500/30",
        text: "text-amber-700 dark:text-amber-300",
        dot: "bg-amber-500",
        accent: "bg-amber-500",
      };
  }
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === "admin";

  // View state: 'month' | 'week'
  const [viewMode, setViewMode] = useState("week"); // Default to week view as per Google Calendar
  const [currentDate, setCurrentDate] = useState(new Date());

  // Tasks & Users Data
  const [tasks, setTasks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState(null); // { id, username, email }
  const [isLoading, setIsLoading] = useState(true);

  // Admin User Filter Popover
  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const userFilterRef = useRef(null);

  // Google Sync & Verification Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState(null); // null | 'success' | 'error'
  const [emailStatusMsg, setEmailStatusMsg] = useState("");

  // Selected Day Overflow Modal (for +N more on monthly view)
  const [selectedDayTasks, setSelectedDayTasks] = useState(null); // { date: Date, tasks: [] }

  // Fetch Tasks for Calendar
  const fetchCalendarTasks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      let url = "http://localhost:3000/tasks/calendar";
      if (isAdmin && selectedUserFilter?.id) {
        url += `?userId=${selectedUserFilter.id}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTasks(response.data || []);
    } catch (err) {
      console.error("Failed to fetch calendar tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Users for Admin filter
  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/users/employees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsersList(response.data || []);
      } catch (err) {
        console.error("Failed to fetch employees list for admin filter:", err);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  // Fetch tasks when user filter changes
  useEffect(() => {
    fetchCalendarTasks();
  }, [selectedUserFilter]);

  // Close User Filter Popover on Outside Click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        userFilterRef.current &&
        !userFilterRef.current.contains(e.target)
      ) {
        setIsUserFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // --- Date Navigation Helpers ---
  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Label for Top Toolbar (e.g. "January 2026" or "Jan 19 – 25, 2026")
  const toolbarPeriodLabel = useMemo(() => {
    if (viewMode === "month") {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }

    // Weekly date range
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startMonth = MONTH_NAMES[startOfWeek.getMonth()].slice(0, 3);
    const endMonth = MONTH_NAMES[endOfWeek.getMonth()].slice(0, 3);

    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startMonth} ${startOfWeek.getDate()} – ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
    } else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
      return `${startMonth} ${startOfWeek.getDate()} – ${endMonth} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
    } else {
      return `${startMonth} ${startOfWeek.getDate()}, ${startOfWeek.getFullYear()} – ${endMonth} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
    }
  }, [currentDate, viewMode]);

  // --- Monthly View Grid Calculation ---
  const monthDaysGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayIndex = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Next month filler days (to make complete weeks)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // --- Weekly View Days Calculation ---
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Helper: Is Date Today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Helper: Get Tasks for a specific date (matching YYYY-MM-DD)
  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      const tDateStr = new Date(t.due_date).toISOString().split("T")[0];
      return tDateStr === dateStr;
    });
  };

  // Send Google Verification Email
  const handleSendGoogleVerification = async () => {
    setIsSendingEmail(true);
    setEmailSentStatus(null);
    setEmailStatusMsg("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/auth/send-google-verify",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEmailSentStatus("success");
      setEmailStatusMsg(
        response.data.message ||
          "Verification email sent! Please check your inbox and click the verify button."
      );
    } catch (err) {
      setEmailSentStatus("error");
      setEmailStatusMsg(
        err.response?.data?.message || "Failed to send verification email."
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Export Tasks to .ics iCalendar file for Google Calendar import
  const handleExportICS = () => {
    if (tasks.length === 0) {
      alert("No tasks with due dates found to export.");
      return;
    }

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Regulate Task Management//EN\n";

    tasks.forEach((t) => {
      if (!t.due_date) return;
      const dueDate = new Date(t.due_date);
      const icsTime = dueDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000);
      const icsEndTime = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      icsContent += `BEGIN:VEVENT\n`;
      icsContent += `UID:task-${t.id}@regulate.app\n`;
      icsContent += `DTSTAMP:${icsTime}\n`;
      icsContent += `DTSTART:${icsTime}\n`;
      icsContent += `DTEND:${icsEndTime}\n`;
      icsContent += `SUMMARY:${t.title}\n`;
      icsContent += `DESCRIPTION:${(t.description || "").replace(/\n/g, " ")}\n`;
      icsContent += `STATUS:${t.status === "completed" ? "CONFIRMED" : "TENTATIVE"}\n`;
      icsContent += `END:VEVENT\n`;
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `regulate-tasks-${new Date().toISOString().split("T")[0]}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Google Calendar Web URL for a specific task
  const generateGoogleCalendarUrl = (task) => {
    if (!task.due_date) return "#";
    const startDate = new Date(task.due_date);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hr default duration

    const formatGDate = (d) =>
      d.toISOString().replace(/-|:|\.\d+/g, "");

    const dates = `${formatGDate(startDate)}/${formatGDate(endDate)}`;
    const title = encodeURIComponent(`Task: ${task.title}`);
    const details = encodeURIComponent(
      `${task.description || ""}\n\nView in Regulate: http://localhost:5173/tasks/${task.id}`
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
  };

  // Filtered Users List for Admin Popover
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return usersList;
    const q = userSearchQuery.toLowerCase();
    return usersList.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [usersList, userSearchQuery]);

  // Current time position for live red line in weekly view
  const now = new Date();
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
  const currentTimePercentage = (currentMinutesFromMidnight / (24 * 60)) * 100;

  return (
    <div className="flex flex-col h-full min-h-[85vh] bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden transition-colors">
      {/* 1. TOP HEADER & TOOLBAR (Replicating Google Calendar Toolbar) */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-md">
        {/* Left: Branding & Date Nav */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
              Calendar
            </h1>
          </div>

          <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />

          {/* Today Button */}
          <button
            type="button"
            onClick={handleGoToday}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Today
          </button>

          {/* Previous / Next Arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              title="Previous"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Next"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Period Title */}
          <span className="text-base sm:text-lg font-black tracking-tight text-zinc-800 dark:text-zinc-100 min-w-[160px]">
            {toolbarPeriodLabel}
          </span>
        </div>

        {/* Right: Actions, User Filters (Admin), Google Sync (User), and View Switcher */}
        <div className="flex items-center gap-3">
          {/* Admin User Filter */}
          {isAdmin && (
            <div className="relative" ref={userFilterRef}>
              <button
                type="button"
                onClick={() => setIsUserFilterOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                  selectedUserFilter
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                    : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>
                  {selectedUserFilter
                    ? selectedUserFilter.username || selectedUserFilter.email
                    : "Filter by User"}
                </span>
                {selectedUserFilter && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUserFilter(null);
                    }}
                    className="p-0.5 hover:bg-blue-500/20 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </button>

              {/* User Selector Dropdown Popover */}
              {isUserFilterOpen && (
                <div className="absolute right-0 top-11 z-50 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-2">
                    <Search className="h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs w-full text-zinc-900 dark:text-white placeholder-zinc-400"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserFilter(null);
                        setIsUserFilterOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-colors ${
                        !selectedUserFilter
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-[10px]">
                          *
                        </div>
                        <span>All Users</span>
                      </div>
                      {!selectedUserFilter && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>

                    {filteredUsers.map((u) => {
                      const isSelected = selectedUserFilter?.id === u.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserFilter(u);
                            setIsUserFilterOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                              {(u.username || u.email || "U")[0].toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="font-bold truncate">
                                {u.username || u.email.split("@")[0]}
                              </p>
                              <p className="text-[10px] text-zinc-400 truncate">
                                {u.email}
                              </p>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <p className="py-4 text-center text-xs text-zinc-400">
                        No users found
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Side: Google Calendar Sync Option */}
          {!isAdmin && (
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:border-blue-500 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-all shadow-sm hover:shadow-blue-500/10"
            >
              {/* Google 4-Color Icon Graphic */}
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>
                {currentUser?.is_google_user
                  ? "Google Calendar Synced"
                  : "Sync Google Calendar"}
              </span>
              {currentUser?.is_google_user && (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </button>
          )}

          {/* View Mode Toggle: Week vs Month */}
          <div className="flex items-center p-1 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-xl border border-zinc-300 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                viewMode === "week"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                viewMode === "month"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </header>

      {/* 2. CALENDAR BODY CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-xs font-bold uppercase tracking-wider">
              Loading calendar tasks...
            </p>
          </div>
        ) : viewMode === "month" ? (
          /* ========================================================================= */
          /* 3. MONTHLY VIEW GRID                                                      */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-center py-2.5 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Grid of Days */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 divide-x divide-y divide-zinc-200 dark:divide-zinc-800/60 min-h-[580px]">
              {monthDaysGrid.map(({ date, isCurrentMonth }, idx) => {
                const dayTasks = getTasksForDate(date);
                const isDateToday = isToday(date);

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] p-2 flex flex-col transition-colors ${
                      isCurrentMonth
                        ? "bg-white dark:bg-[#09090b]"
                        : "bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-400 dark:text-zinc-600"
                    } hover:bg-zinc-50 dark:hover:bg-zinc-900/30`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                          isDateToday
                            ? "bg-blue-600 text-white font-black shadow-md shadow-blue-500/30"
                            : isCurrentMonth
                            ? "text-zinc-800 dark:text-zinc-200"
                            : "text-zinc-400 dark:text-zinc-600"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] font-bold text-zinc-400">
                          {dayTasks.length} task{dayTasks.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Task Chips in Day Cell */}
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                      {dayTasks.slice(0, 3).map((task) => {
                        const dueDateObj = new Date(task.due_date);
                        const isOverdue =
                          dueDateObj < new Date() && task.status !== "completed";
                        const styles = getStatusStyles(task.status, isOverdue);

                        const timeStr = dueDateObj.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });

                        return (
                          <div
                            key={task.id}
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            title={`${task.title} - ${task.status} (${timeStr})`}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer truncate transition-transform hover:scale-[1.02] active:scale-95 ${styles.bg} ${styles.border} ${styles.text}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`}
                            />
                            <span className="text-[10px] opacity-75 shrink-0">
                              {timeStr}
                            </span>
                            <span className="truncate">{task.title}</span>
                          </div>
                        );
                      })}

                      {/* +N More tasks button */}
                      {dayTasks.length > 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDayTasks({ date, tasks: dayTasks })
                          }
                          className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline text-left mt-0.5"
                        >
                          +{dayTasks.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 4. WEEKLY TIME-GRID VIEW (1:1 Google Calendar Replica)                    */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Week Days Header Row */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 sticky top-0 z-20 backdrop-blur-md">
              <div className="p-3 border-r border-zinc-200 dark:border-zinc-800" />
              {weekDays.map((day, idx) => {
                const isDateToday = isToday(day);
                return (
                  <div
                    key={idx}
                    className="p-3 text-center border-r border-zinc-200 dark:border-zinc-800 last:border-r-0"
                  >
                    <p className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider">
                      {DAYS_OF_WEEK[day.getDay()]}
                    </p>
                    <div className="mt-1 flex justify-center">
                      <span
                        className={`text-sm sm:text-base font-black w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isDateToday
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40"
                            : "text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 24-Hour Time Grid */}
            <div className="flex-1 grid grid-cols-[60px_repeat(7,1fr)] relative min-w-[700px]">
              {/* Hour Labels Column */}
              <div className="border-r border-zinc-200 dark:border-zinc-800 select-none">
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div
                    key={hour}
                    className="h-16 border-b border-zinc-100 dark:border-zinc-800/40 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 text-right pr-2 pt-1"
                  >
                    {formatHourLabel(hour)}
                  </div>
                ))}
              </div>

              {/* 7 Day Columns with Task Placements */}
              {weekDays.map((day, dayIdx) => {
                const dayTasks = getTasksForDate(day);
                const isDateToday = isToday(day);

                return (
                  <div
                    key={dayIdx}
                    className="border-r border-zinc-200 dark:border-zinc-800/60 last:border-r-0 relative group"
                  >
                    {/* Background Hour Lines */}
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div
                        key={hour}
                        className="h-16 border-b border-zinc-100 dark:border-zinc-800/30"
                      />
                    ))}

                    {/* LIVE RED TIME MARKER (for Today's Column) */}
                    {isDateToday && (
                      <div
                        style={{ top: `${currentTimePercentage}%` }}
                        className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-black -ml-1.5 animate-pulse" />
                        <div className="h-[2px] w-full bg-red-500 shadow-sm shadow-red-500/50" />
                      </div>
                    )}

                    {/* Tasks Placed into Time Slots */}
                    {dayTasks.map((task) => {
                      const dueDate = new Date(task.due_date);
                      const minutesFromMidnight =
                        dueDate.getHours() * 60 + dueDate.getMinutes();
                      const topPx = (minutesFromMidnight / 60) * 64; // 64px = 16rem = 1 hour row
                      const isOverdue =
                        dueDate < new Date() && task.status !== "completed";
                      const styles = getStatusStyles(task.status, isOverdue);

                      const timeFormatted = dueDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });

                      return (
                        <div
                          key={task.id}
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          style={{
                            top: `${Math.max(0, topPx)}px`,
                            minHeight: "56px",
                          }}
                          className={`absolute left-1 right-1 z-10 p-2 rounded-xl border shadow-md cursor-pointer transition-all hover:scale-[1.02] hover:z-20 ${styles.bg} ${styles.border} ${styles.text}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-extrabold uppercase opacity-85 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeFormatted}
                            </span>
                            <span
                              className={`h-2 w-2 rounded-full ${styles.dot}`}
                            />
                          </div>

                          <p className="text-xs font-black truncate mt-0.5">
                            {task.title}
                          </p>

                          {task.assignee_username && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] opacity-75">
                              <User className="h-2.5 w-2.5" />
                              <span className="truncate">
                                {task.assignee_username}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. USER GOOGLE CALENDAR SYNC MODAL                                        */}
      {/* ========================================================================= */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-zinc-900 dark:text-white">
            <button
              type="button"
              onClick={() => {
                setIsGoogleModalOpen(false);
                setEmailSentStatus(null);
                setEmailStatusMsg("");
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  Google Calendar Integration
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sync and export your Regulate tasks to Google Calendar
                </p>
              </div>
            </div>

            {/* Verification State: If User is Already Google Verified */}
            {currentUser?.is_google_user ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                      Google Account Verified
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Your account ({currentUser.email}) is verified as an active
                      Google user. You can export tasks to Google Calendar directly.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleExportICS}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-black font-black text-xs hover:opacity-90 transition-all shadow-md"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download .ICS Calendar File (All Tasks)</span>
                  </button>

                  <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                    Import this .ics file into your Google Calendar (Settings &rarr; Import &amp; Export) to view all tasks with due dates in your personal Google Calendar.
                  </p>
                </div>
              </div>
            ) : (
              /* If User is Not Google Verified: Request Verification Email */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-blue-700 dark:text-blue-300">
                      Verification Required
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      To enable Google Calendar synchronization, we need to verify your Google email address (<strong>{currentUser?.email}</strong>).
                    </p>
                  </div>
                </div>

                {emailSentStatus === "success" ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                      Verification Email Dispatched!
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      {emailStatusMsg}
                    </p>
                  </div>
                ) : emailSentStatus === "error" ? (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-xs font-black text-red-700 dark:text-red-300">
                      Failed to send verification email
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      {emailStatusMsg}
                    </p>
                  </div>
                ) : null}

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSendingEmail || emailSentStatus === "success"}
                    onClick={handleSendGoogleVerification}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending verification email...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Verification Email to {currentUser?.email}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DAY OVERFLOW MODAL (for +N more on monthly view)                       */}
      {/* ========================================================================= */}
      {selectedDayTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-zinc-900 dark:text-white">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h4 className="text-base font-black">
                  {selectedDayTasks.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h4>
                <p className="text-xs text-zinc-500">
                  {selectedDayTasks.tasks.length} tasks scheduled for this day
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayTasks(null)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {selectedDayTasks.tasks.map((task) => {
                const dueDateObj = new Date(task.due_date);
                const isOverdue =
                  dueDateObj < new Date() && task.status !== "completed";
                const styles = getStatusStyles(task.status, isOverdue);

                const timeStr = dueDateObj.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedDayTasks(null);
                      navigate(`/tasks/${task.id}`);
                    }}
                    className={`p-3 rounded-2xl border flex items-start justify-between gap-3 cursor-pointer hover:scale-[1.01] transition-transform ${styles.bg} ${styles.border} ${styles.text}`}
                  >
                    <div>
                      <p className="text-xs font-black">{task.title}</p>
                      <p className="text-[10px] opacity-75 mt-0.5">
                        Due: {timeStr} • Status: {task.status}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-70" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
