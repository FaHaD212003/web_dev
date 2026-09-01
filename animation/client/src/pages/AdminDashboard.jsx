import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, CalendarRange, Database, Users } from "lucide-react";
import UserSearchPanel from "../components/UserSearchPanel";

const ranges = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

const statusColors = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#10b981",
};

const pieColors = ["#f59e0b", "#3b82f6", "#10b981"];

export default function AdminDashboard() {
  const [range, setRange] = useState("weekly");
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:3000/users/dashboard-stats",
          {
            params: { range },
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (isActive) {
          setStats(response.data);
          setError("");
        }
      } catch (err) {
        if (isActive) {
          setError("Failed to load dashboard analytics.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isActive = false;
    };
  }, [range]);

  const chartData = useMemo(() => {
    return (stats?.trend || []).map((entry) => ({
      label: entry.period_label,
      pending: Number(entry.pending_tasks || 0),
      in_progress: Number(entry.in_progress_tasks || 0),
      completed: Number(entry.completed_tasks || 0),
      total: Number(entry.total_tasks || 0),
    }));
  }, [stats]);

  const statusData = useMemo(
    () => [
      {
        name: "Pending",
        value: Number(stats?.statusCounts?.pending || 0),
        key: "pending",
      },
      {
        name: "In Progress",
        value: Number(stats?.statusCounts?.in_progress || 0),
        key: "in_progress",
      },
      {
        name: "Completed",
        value: Number(stats?.statusCounts?.completed || 0),
        key: "completed",
      },
    ],
    [stats],
  );

  const summaryCards = [
    {
      label: "Registered Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      accent: "from-cyan-500/10 to-cyan-500/0",
    },
    {
      label: `Tasks (${range})`,
      value: stats?.totalTasks ?? 0,
      icon: Database,
      accent: "from-violet-500/10 to-violet-500/0",
    },
    {
      label: "Pending",
      value: stats?.statusCounts?.pending ?? 0,
      icon: CalendarRange,
      accent: "from-amber-500/10 to-amber-500/0",
    },
    {
      label: "In Progress",
      value: stats?.statusCounts?.in_progress ?? 0,
      icon: BarChart3,
      accent: "from-blue-500/10 to-blue-500/0",
    },
    {
      label: "Completed",
      value: stats?.statusCounts?.completed ?? 0,
      icon: BarChart3,
      accent: "from-emerald-500/10 to-emerald-500/0",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
            Admin dashboard
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-white">
            Dashboard command center
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Monitor users, task volume, and task state distribution. Switch the
            time window to see weekly, monthly, or yearly activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-2">
          {ranges.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setRange(option.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                range === option.key
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-zinc-500">
          Loading dashboard analytics...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className={`rounded-2xl border border-zinc-800 bg-gradient-to-br ${card.accent} p-5 shadow-xl shadow-black/10`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                          {card.label}
                        </p>
                        <div className="mt-2 text-3xl font-black text-white">
                          {card.value}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/10">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                      Task trend
                    </p>
                    <h3 className="mt-1 text-xl font-black text-white">
                      {range} activity by status
                    </h3>
                  </div>
                </div>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="label" stroke="#71717a" />
                      <YAxis stroke="#71717a" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#09090b",
                          border: "1px solid #27272a",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="pending"
                        stackId="status"
                        fill={statusColors.pending}
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="in_progress"
                        stackId="status"
                        fill={statusColors.in_progress}
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="completed"
                        stackId="status"
                        fill={statusColors.completed}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/10">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                      State distribution
                    </p>
                    <h3 className="mt-1 text-xl font-black text-white">
                      Task status breakdown
                    </h3>
                  </div>
                </div>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={4}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={entry.key} fill={pieColors[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#09090b",
                          border: "1px solid #27272a",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <UserSearchPanel
              title="Search a user"
              description="Search by email and open the user detail page."
              compact
            />

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                Shortcuts
              </p>
              <h3 className="mt-1 text-lg font-black text-white">
                User management
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Use the Users tab to browse the admin directory, then open any
                profile for a deeper task breakdown.
              </p>
              <Link
                to="/admin-users"
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
              >
                Open Users page
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
