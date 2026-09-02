import { useEffect, useState, useRef, useCallback } from "react";
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  const navigate = useNavigate();
  const sentinelRef = useRef(null);

  const fetchUsers = useCallback(
    async (searchQuery = "", pageNumber = 1, isReset = false) => {
      try {
        if (isReset) {
          setIsLoadingInitial(true);
        } else {
          setIsLoadingMore(true);
        }

        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/users/search", {
          params: { query: searchQuery, page: pageNumber, limit: 15 },
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedUsers = Array.isArray(response.data)
          ? response.data
          : response.data.users || [];
        const serverHasMore = response.data.hasMore ?? false;
        const serverTotal = response.data.total ?? fetchedUsers.length;

        if (isReset) {
          setUsers(fetchedUsers);
        } else {
          setUsers((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const newUnique = fetchedUsers.filter((u) => !existingIds.has(u.id));
            return [...prev, ...newUnique];
          });
        }

        setPage(pageNumber);
        setHasMore(serverHasMore);
        setTotalUsers(serverTotal);
      } catch (err) {
        if (isReset) {
          setUsers([]);
        }
      } finally {
        if (isReset) {
          setIsLoadingInitial(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    },
    [],
  );

  // Debounced search query change -> Resets to Page 1
  useEffect(() => {
    let isActive = true;
    const timer = setTimeout(() => {
      if (isActive) {
        fetchUsers(query, 1, true);
      }
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [query, fetchUsers]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!hasMore || isLoadingInitial || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchUsers(query, page + 1, false);
        }
      },
      { threshold: 0.1, rootMargin: "150px" },
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isLoadingInitial, isLoadingMore, page, query, fetchUsers]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/20 backdrop-blur-sm w-full">
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

      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
          Search by email
        </label>
        {!isLoadingInitial && (
          <span className="text-xs text-zinc-500 font-medium">
            {users.length} of {totalUsers} users
          </span>
        )}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a name or email..."
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-cyan-500/60"
      />

      <div
        className={`mt-5 space-y-3 ${
          compact ? "max-h-[390px] overflow-auto pr-1" : ""
        }`}
      >
        {isLoadingInitial ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-6 text-sm text-zinc-400 font-semibold">
            <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            Searching users...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-6 text-sm text-zinc-500 text-center font-medium">
            No users found matching "{query}".
          </div>
        ) : (
          <>
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => navigate(`/admin-users/${user.id}`)}
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {user.email}
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      ID {user.id}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
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
            ))}

            {/* Infinite scroll sentinel for user directory */}
            <div ref={sentinelRef} className="h-8 flex items-center justify-center pt-2">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 py-2">
                  <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Loading more users...
                </div>
              )}
              {!hasMore && users.length > 0 && (
                <p className="text-xs text-zinc-600 font-medium py-1">
                  All {totalUsers} users loaded
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
