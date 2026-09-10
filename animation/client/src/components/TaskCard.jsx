import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import BorderGlow from "./BorderGlow";

const statusStyles = {
  pending: "bg-amber-950 text-amber-400 border border-amber-900",
  in_progress: "bg-blue-950 text-blue-400 border border-blue-900",
  completed: "bg-emerald-950 text-emerald-400 border border-emerald-900",
};

const formatDueDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  theme = "dark",
}) {
  const navigate = useNavigate();
  const isLight = theme === "light";
  const cardBg = isLight ? "#FFFFFF" : "#08080A";

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!task.due_date || task.status === "completed") return;

    // Check periodically so the card updates the instant the clock hits the due date
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);

    const handleTaskDue = (e) => {
      if (!e.detail?.taskId || Number(e.detail.taskId) === Number(task.id)) {
        setNow(Date.now());
      }
    };

    window.addEventListener("task:due", handleTaskDue);

    return () => {
      clearInterval(timer);
      window.removeEventListener("task:due", handleTaskDue);
    };
  }, [task.id, task.due_date, task.status]);

  const isOverdue =
    task.due_date &&
    new Date(task.due_date).getTime() <= now &&
    task.status !== "completed";

  const handleCardClick = () => {
    navigate(`/tasks/${task.id}`);
  };

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", String(task.id));
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(task);
      }}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      className="bg-white dark:bg-[#08080A] rounded-2xl shadow-sm  dark:shadow-xl flex flex-col gap-3  dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
    >
      <BorderGlow
        edgeSensitivity={30}
        glowColor={isLight ? "210 80 60" : "40 80 80"}
        backgroundColor={cardBg}
        borderRadius={28}
        glowRadius={55}
        glowIntensity={isLight ? 0.8 : 1}
        coneSpread={35}
        animated={false}
        colors={
          isLight
            ? ["#38bdf8", "#818cf8", "#34d399"]
            : ["#c084fc", "#f472b6", "#38bdf8"]
        }
      >
        <div
          style={{
            paddingTop: "2.5em",
            paddingBottom: "2.5em",
            paddingLeft: "2em",
            paddingRight: "2em",
          }}
        >
          <div className="flex justify-between items-start gap-3">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {task.title}
            </h3>
            <span
              className={`px-2.5 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider shrink-0 ${
                statusStyles[task.status] ?? statusStyles.pending
              }`}
            >
              {task.status?.replace("_", " ")}
            </span>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 flex-1 line-clamp-3 leading-relaxed mt-2">
            {task.description || "No description provided."}
          </p>

          {task.due_date && (
            <div
              className={`flex items-center gap-1.5 text-[11px] font-semibold mt-3 px-2.5 py-1 rounded-lg border w-fit ${
                isOverdue
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-bold"
                  : "bg-zinc-100 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <Clock className="h-3 w-3 shrink-0" />
              <span>Due: {formatDueDate(task.due_date)}</span>
              {isOverdue && (
                <span className="text-[9px] uppercase tracking-wider text-red-500">
                  (Overdue)
                </span>
              )}
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-3">
            <span>Assignee #{task.assignee_id || "None"}</span>
            <span>Creator #{task.creator_id}</span>
          </div>

          <div className="flex gap-2 mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 dark:border-zinc-700/60 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold dark:text-white transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:border-red-900/40 dark:text-red-400 rounded-lg text-xs font-bold transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </BorderGlow>
    </div>
  );
}
