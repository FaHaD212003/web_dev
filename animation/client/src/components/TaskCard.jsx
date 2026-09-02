import { useNavigate } from "react-router-dom";
import BorderGlow from "./BorderGlow";

const statusStyles = {
  pending: "bg-amber-950 text-amber-400 border border-amber-900",
  in_progress: "bg-blue-950 text-blue-400 border border-blue-900",
  completed: "bg-emerald-950 text-emerald-400 border border-emerald-900",
};

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}) {
  const navigate = useNavigate();

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
      className="bg-zinc-900   rounded-2xl shadow-lg flex flex-col gap-3 hover:border-zinc-700 hover:bg-zinc-900/90 transition-all cursor-pointer group"
    >
      <BorderGlow
        edgeSensitivity={30}
        glowColor="40 80 80"
        backgroundColor="#120F17"
        borderRadius={28}
        glowRadius={50}
        glowIntensity={1}
        coneSpread={35}
        animated={false}
        colors={["#c084fc", "#f472b6", "#38bdf8"]}
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
            <h3 className="text-base font-bold text-white leading-snug group-hover:text-cyan-400 transition-colors">
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

          <p className="text-xs text-zinc-400 flex-1 line-clamp-3 leading-relaxed">
            {task.description || "No description provided."}
          </p>

          <div className="flex justify-between items-center text-[11px] text-zinc-500 font-medium mt-1">
            <span>Assignee #{task.assignee_id || "None"}</span>
            <span>Creator #{task.creator_id}</span>
          </div>

          <div className="flex gap-2 mt-2 pt-3 border-t border-zinc-800/60">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-white transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="flex-1 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 rounded-lg text-xs font-bold transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </BorderGlow>
    </div>
  );
}
