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
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", String(task.id));
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(task);
      }}
      onDragEnd={onDragEnd}
      className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg flex flex-col gap-4 hover:border-zinc-700 transition-colors cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-start gap-4">
        <h3 className="text-lg font-bold text-white leading-tight">
          {task.title}
        </h3>
        <span
          className={`px-3 py-1 text-[10px] font-black rounded-md uppercase tracking-wider ${
            statusStyles[task.status] ?? statusStyles.pending
          }`}
        >
          {task.status}
        </span>
      </div>

      <p className="text-sm text-zinc-400 flex-1 line-clamp-3">
        {task.description}
      </p>

      <div className="flex justify-between items-center text-xs text-zinc-500 font-medium mt-2">
        <span>Assignee ID: {task.assignee_id}</span>
        <span>Creator ID: {task.creator_id}</span>
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-800/50">
        <button
          onClick={() => onEdit(task)}
          className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-bold text-white transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="flex-1 py-2 bg-red-950/50 hover:bg-red-900/60 border border-red-900/50 text-red-400 rounded-lg text-sm font-bold transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
