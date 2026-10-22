import { useEffect, useState } from "react";
import { ChartNoAxesCombined, Ticket, Sparkles, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import FeatureCard from "../components/FeatureCard";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get("/dashboard/admin");
        setSummary(response.data?.data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-8 text-center text-slate-400">
        Loading administration overview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-8 text-center text-rose-200">
        <AlertTriangle className="mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-6 sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-200">
          <ChartNoAxesCombined size={22} />
        </div>
        <h2 className="mt-5 text-xl font-semibold">Welcome back, BookLeaf Admin</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          Overview of author support requests and priority queues.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/[0.07] bg-[#0b1627] p-4">
            <p className="text-xs text-slate-500">Total Tickets</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {summary?.totalTickets || 0}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#0b1627] p-4">
            <p className="text-xs text-slate-500">Open</p>
            <p className="mt-1 text-2xl font-semibold text-blue-300">
              {summary?.counts?.open || 0}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#0b1627] p-4">
            <p className="text-xs text-slate-500">In Progress</p>
            <p className="mt-1 text-2xl font-semibold text-amber-300">
              {summary?.counts?.inProgress || 0}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#0b1627] p-4">
            <p className="text-xs text-slate-500">Resolved/Closed</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">
              {(summary?.counts?.resolved || 0) + (summary?.counts?.closed || 0)}
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <FeatureCard
            icon={Ticket}
            title="Ticket Queue"
            description="Review and filter author support requests"
            onClick={() => navigate("/admin/tickets")}
          />
          <FeatureCard
            icon={Sparkles}
            title="AI-assisted responses"
            description="Review, edit and send drafts"
            onClick={() => navigate("/admin/tickets")}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={18} className="text-rose-400" />
            <h3 className="text-sm font-semibold text-slate-100">Urgent Unresolved Tickets</h3>
          </div>
          <div className="space-y-3">
            {summary?.urgentTickets?.length > 0 ? (
              summary.urgentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#0b1627] p-3 transition hover:border-rose-400/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {ticket.subject}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Author: {ticket.author?.name} · {ticket.priority}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    className="shrink-0 rounded-lg bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-400/20"
                  >
                    Open
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">No urgent tickets requiring attention.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={18} className="text-indigo-300" />
            <h3 className="text-sm font-semibold text-slate-100">Recent Incoming Tickets</h3>
          </div>
          <div className="space-y-3">
            {summary?.recentTickets?.length > 0 ? (
              summary.recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#0b1627] p-3 transition hover:border-indigo-400/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {ticket.subject}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Author: {ticket.author?.name} · {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                  className="shrink-0 rounded-lg bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-400/20"
                >
                  Open
                </button>
              </div>
            ))) : (
              <p className="text-sm text-slate-500 italic">No recent tickets found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
