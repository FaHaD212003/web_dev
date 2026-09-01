import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  ClipboardList,
  UserPlus2,
  ShieldAlert,
  ShieldCheck,
  Crown,
  ShieldOff,
} from "lucide-react";

const statusCards = [
  { key: "pending", label: "Pending", color: "amber" },
  { key: "in_progress", label: "In Progress", color: "blue" },
  { key: "completed", label: "Completed", color: "emerald" },
];

const colorStyles = {
  cyan: {
    card: "border-cyan-500/20 bg-cyan-500/10",
    icon: "border-cyan-500/20 bg-black/20 text-cyan-300",
  },
  violet: {
    card: "border-violet-500/20 bg-violet-500/10",
    icon: "border-violet-500/20 bg-black/20 text-violet-300",
  },
  emerald: {
    card: "border-emerald-500/20 bg-emerald-500/10",
    icon: "border-emerald-500/20 bg-black/20 text-emerald-300",
  },
  amber: {
    card: "border-amber-500/20 bg-amber-500/10",
    icon: "border-amber-500/20 bg-black/20 text-amber-300",
  },
  blue: {
    card: "border-blue-500/20 bg-blue-500/10",
    icon: "border-blue-500/20 bg-black/20 text-blue-300",
  },
};

function MetricCard({ label, value, color, icon: Icon }) {
  const styles = colorStyles[color];

  return (
    <div className={`rounded-2xl border p-5 ${styles.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
            {label}
          </p>
          <div className="mt-2 text-3xl font-black text-white">{value}</div>
        </div>
        <div className={`rounded-xl border bg-black/20 p-3 ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:3000/users/${id}/details`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (isActive) {
          setData(response.data);
        }
      } catch (err) {
        if (isActive) {
          setError("Failed to load user details.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isActive = false;
    };
  }, [id]);

  const assignedStatus = data?.stats?.assignedStatus || {};
  const createdStatus = data?.stats?.createdStatus || {};

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `http://localhost:3000/users/${id}/details`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    setData(response.data);
  };

  const updateAccess = async (payload) => {
    try {
      setIsUpdating(true);
      setActionError("");
      const token = localStorage.getItem("token");
      await axios.patch(`http://localhost:3000/users/${id}/access`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshUser();
    } catch (err) {
      setActionError("Failed to update this user.");
    } finally {
      setIsUpdating(false);
    }
  };

  const makeAdmin = () => updateAccess({ role: "admin" });
  const makeUser = () => updateAccess({ role: "user" });
  const revokeUser = () => updateAccess({ is_revoked: true });
  const restoreUser = () => updateAccess({ is_revoked: false });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/admin-users")}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </button>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
            User profile
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-white">
            {data?.user?.email || "Loading user..."}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Detailed task ownership and status breakdown for this account.
          </p>
        </div>

        {data?.user?.role && (
          <span className="inline-flex w-fit rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">
            {data.user.role}
          </span>
        )}
      </div>

      {data?.user && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-300">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                  Role management
                </p>
                <h3 className="text-lg font-black text-white">
                  Promote or demote
                </h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-400">
              Switch this account between admin and user access.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={makeAdmin}
                disabled={isUpdating || data.user.role === "admin"}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                Make Admin
              </button>
              <button
                type="button"
                onClick={makeUser}
                disabled={isUpdating || data.user.role === "user"}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldOff className="h-4 w-4" />
                Make User
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                  Access control
                </p>
                <h3 className="text-lg font-black text-white">
                  Revoke or restore
                </h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-400">
              Revoked users cannot log in or continue using protected routes.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={revokeUser}
                disabled={isUpdating || data.user.is_revoked}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Revoke Access
              </button>
              <button
                type="button"
                onClick={restoreUser}
                disabled={isUpdating || !data.user.is_revoked}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Restore Access
              </button>
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-zinc-500">
          Loading user details...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <MetricCard
              label="Assigned to user"
              value={data.stats.assignedToUser}
              color="cyan"
              icon={UserRound}
            />
            <MetricCard
              label="Assigned by user"
              value={data.stats.assignedByUser}
              color="violet"
              icon={UserPlus2}
            />
            <MetricCard
              label="Self-assigned"
              value={data.stats.selfAssignedTasks}
              color="emerald"
              icon={ClipboardList}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/10">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-300">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                    Tasks assigned to user
                  </p>
                  <h3 className="text-xl font-black text-white">
                    Task state breakdown
                  </h3>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {statusCards.map((card) => (
                  <div
                    key={card.key}
                    className={`rounded-2xl border p-4 ${colorStyles[card.color].card}`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                      {card.label}
                    </p>
                    <div className="mt-2 text-3xl font-black text-white">
                      {assignedStatus[card.key] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/10">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-violet-300">
                  <UserPlus2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                    Tasks assigned by user
                  </p>
                  <h3 className="text-xl font-black text-white">
                    Delegated work breakdown
                  </h3>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {statusCards.map((card) => (
                  <div
                    key={card.key}
                    className={`rounded-2xl border p-4 ${colorStyles[card.color].card}`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                      {card.label}
                    </p>
                    <div className="mt-2 text-3xl font-black text-white">
                      {createdStatus[card.key] || 0}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
                Tasks created by this user for others:{" "}
                {data.stats.assignedByUser}
              </div>
            </section>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              Summary
            </p>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
                This user currently has {data.stats.assignedToUser} task(s)
                assigned to them.
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
                They created {data.stats.assignedByUser} task(s) for other
                users.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
