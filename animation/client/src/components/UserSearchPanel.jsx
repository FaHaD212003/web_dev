import { useEffect, useState } from "react";
import axios from "axios";
import { Search, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserSearchPanel({
  title = "Search Users",
  description = "Find a user and open their detail page.",
  compact = false,
}) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/users/search", {
          params: { query },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isActive) {
          setUsers(response.data);
        }
      } catch (err) {
        if (isActive) {
          setUsers([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/20 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
            Admin tool
          </p>
          <h3 className="text-xl font-black text-white mt-1">{title}</h3>
          <p className="text-sm text-zinc-400 mt-1">{description}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-white/5 border border-zinc-800 flex items-center justify-center text-zinc-300">
          <Search className="h-4 w-4" />
        </div>
      </div>

      <label className="block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">
        Search by email
      </label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a name or email..."
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-cyan-500/60"
      />

      <div
        className={`mt-5 space-y-3 ${compact ? "max-h-[390px] overflow-auto pr-1" : ""}`}
      >
        {isLoading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-5 text-sm text-zinc-500">
            Searching users...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-5 text-sm text-zinc-500">
            No users found.
          </div>
        ) : (
          users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => navigate(`/admin-users/${user.id}`)}
              className="flex w-full items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">
                    {user.email}
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    ID {user.id}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                  {user.role || "user"}
                </span>
                {user.is_revoked ? (
                  <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">
                    Revoked
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                    Active
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
