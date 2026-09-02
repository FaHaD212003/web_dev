import { useEffect, useState } from "react";
import axios from "axios";
import { Users, ShieldCheck, Search } from "lucide-react";
import UserSearchPanel from "../components/UserSearchPanel";

export default function AdminUsersPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:3000/users/dashboard-stats",
          {
            params: { range: "monthly" },
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (isActive) {
          setTotalUsers(Number(response.data?.totalUsers || 0));
        }
      } catch (err) {
        if (isActive) {
          setTotalUsers(0);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
            Admin users
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-white">
            User directory
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Browse the full admin user list, search by email, and jump directly
            to a profile.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 shadow-xl shadow-black/10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                Registered users
              </p>
              <div className="text-3xl font-black text-white">
                {isLoading ? "..." : totalUsers}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full">
        <UserSearchPanel
          title="Search and open profiles"
          description="Type an email address or name fragment to filter users."
        />
      </div>
    </div>
  );
}
