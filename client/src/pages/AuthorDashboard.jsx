import { useEffect, useState } from "react";
import { BookOpen, LifeBuoy, Ticket, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import FeatureCard from "../components/FeatureCard";

export default function AuthorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] || "Author";

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get("/dashboard/author");
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
        Loading your workspace...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-8 text-center text-rose-200">
        <AlertCircle className="mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-6 sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-200">
          <BookOpen size={22} />
        </div>
        <h2 className="mt-5 text-xl font-semibold">Welcome back, {firstName}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          Your publishing workspace is ready.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.07] bg-[#0b1627] p-4">
            <p className="text-xs text-slate-500">Your Books</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {summary?.bookCount || 0}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#0b1627] p-4">
            <p className="text-xs text-slate-500">Total Tickets</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {summary?.ticketCounts?.total || 0}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#0b1627] p-4">
            <p className="text-xs text-slate-500">Active Tickets</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-300">
              {summary?.ticketCounts?.open + (summary?.ticketCounts?.inProgress || 0)}
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <FeatureCard
            icon={BookOpen}
            title="My Books"
            description="View publishing status and royalty details"
            onClick={() => navigate("/author/books")}
          />
          <FeatureCard
            icon={Ticket}
            title="My Tickets"
            description="Track support requests and replies"
            onClick={() => navigate("/author/tickets")}
          />
          <FeatureCard
            icon={LifeBuoy}
            title="Support"
            description="Create a new support ticket"
            onClick={() => navigate("/author/tickets/new")}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-400/20 bg-[#111d30] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
            <Clock size={16} />
          </div>
          <h3 className="text-sm font-semibold text-slate-100">Latest Support Replies</h3>
        </div>
        {summary?.latestReplies?.length > 0 ? (
          <div className="space-y-3">
            {summary.latestReplies.map((reply) => (
              <div key={reply.id} className="rounded-xl border border-white/[0.07] bg-[#0b1627] p-4">
                <p className="text-sm font-medium text-slate-200">
                  {reply.ticketSubject || reply.ticketId}
                </p>
                <p className="mt-2 line-clamp-3 text-sm italic leading-relaxed text-slate-300">
                  "{reply.content}"
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    {reply.senderName} · {new Date(reply.createdAt).toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/author/tickets/${reply.ticketId}`)}
                    className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    View Ticket →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-white/[0.07] bg-[#0b1627] p-4 text-sm text-slate-500">
            No public support replies yet.
          </p>
        )}
      </section>

      {/*
      {summary?.latestReply && (
        <section className="rounded-2xl border border-emerald-400/20 bg-[#111d30] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <Clock size={16} />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Latest Support Reply</h3>
          </div>
          <div className="bg-[#0b1627] rounded-xl p-4 border border-white/[0.07]">
            <p className="text-sm text-slate-300 italic leading-relaxed">
              "{summary.latestReply.content}"
            </p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                From {summary.latestReply.senderName} · {new Date(summary.latestReply.createdAt).toLocaleString()}
              </p>
              <button
                onClick={() => navigate(`/author/tickets/${summary.latestReply.ticketId}`)}
                className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
              >
                View Ticket →
              </button>
            </div>
          </div>
        </section>
      )}
      */}

      <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-6">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">Recent Tickets</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 uppercase">
              <tr>
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Priority</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {summary?.recentTickets?.length > 0 ? (
                summary.recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="group">
                    <td className="py-3 text-slate-300">{ticket.subject}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        ticket.status === "OPEN" ? "bg-blue-400/10 text-blue-300" :
                        ticket.status === "IN_PROGRESS" ? "bg-amber-400/10 text-amber-300" :
                        "bg-slate-400/10 text-slate-300"
                      }`}>
                        {ticket.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{ticket.priority}</td>
                    <td className="py-3 text-slate-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => navigate(`/author/tickets/${ticket.id}`)}
                        className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No recent tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
