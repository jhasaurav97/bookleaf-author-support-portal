import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  AlertCircle,
  Clock3,
  MessageSquare,
  RefreshCw,
  Ticket,
  Search,
  X
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

function formatLabel(value) {
  if (!value) return "Not specified";
  return String(value).replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ value }) {
  const status = String(value || "UNKNOWN").toUpperCase();

  const styles = {
    OPEN: "bg-blue-400/10 text-blue-300",
    IN_PROGRESS: "bg-amber-400/10 text-amber-300",
    RESOLVED: "bg-emerald-400/10 text-emerald-300",
    CLOSED: "bg-slate-400/10 text-slate-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || "bg-slate-400/10 text-slate-300"
      }`}
    >
      {formatLabel(status)}
    </span>
  );
}

function PriorityBadge({ value }) {
  const priority = String(value || "MEDIUM").toUpperCase();

  const styles = {
    CRITICAL: "text-rose-300",
    HIGH: "text-orange-300",
    MEDIUM: "text-amber-300",
    LOW: "text-slate-400",
  };

  return (
    <span
      className={`text-xs font-medium ${styles[priority] || "text-slate-400"}`}
    >
      {formatLabel(priority)} priority
    </span>
  );
}

function getTickets(response) {
  const payload = response.data?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.tickets)) return payload.tickets;
  if (Array.isArray(payload?.items)) return payload.items;

  return null;
}

function getTicketDetails(response) {
  const payload = response.data?.data;

  return payload?.ticket || payload?.data?.ticket || payload;
}

export default function AuthorTicketsPage() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [tickets, setTickets] = useState([]);
  const [ticketDetails, setTicketDetails] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [detailsErrorTicketId, setDetailsErrorTicketId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const selectedTicketId = ticketId || null;
  const displayedTicketDetails =
    ticketDetails?.id === selectedTicketId ? ticketDetails : null;
  const currentDetailsError =
    detailsErrorTicketId === selectedTicketId ? detailsError : "";

  const loadTickets = useCallback(async (silent = false) => {
    try {
      const response = await api.get("/tickets");
      const result = getTickets(response);

      if (!result) {
        throw new Error("Unexpected ticket list response from the server.");
      }

      setTickets(result);
      setError("");
    } catch (err) {
      if (!silent) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load your tickets.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load tickets immediately and check for updates every 5 seconds.
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      void loadTickets();
    }, 0);

    const refreshTimer = setInterval(() => {
      void loadTickets(true);
    }, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(refreshTimer);
    };
  }, [loadTickets]);
  
  // Load the original query and public support responses for the selected ticket.
  useEffect(() => {
    if (!selectedTicketId) {
      return;
    }

    let active = true;

    async function loadDetails(silent = false) {
      try {
        if (!silent) {
          setDetailsLoading(true);
          setDetailsError("");
          setDetailsErrorTicketId(selectedTicketId);
        }

        const response = await api.get(`/tickets/${selectedTicketId}`);

        const result = getTicketDetails(response);

        if (!result || !result.id) {
          throw new Error("Ticket details were not returned by the server.");
        }

        if (active) {
          setTicketDetails(result);
          setDetailsError("");
          setDetailsErrorTicketId(selectedTicketId);
        }
      } catch (err) {
        if (active && !silent) {
          setDetailsError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load this ticket.",
          );
          setDetailsErrorTicketId(selectedTicketId);
        }
      } finally {
        if (active && !silent) setDetailsLoading(false);
      }
    }

    const initialTimer = setTimeout(() => {
      void loadDetails();
    }, 0);

    const timer = setInterval(() => {
      void loadDetails(true);
    }, 5000);

    return () => {
      active = false;
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, [selectedTicketId]);

  const visibleMessages = Array.isArray(displayedTicketDetails?.messages)
    ? displayedTicketDetails.messages
    : [];

  const visibleTickets = useMemo(() => {
    const filtered = tickets.filter((ticket) => {
      const query = searchQuery.toLowerCase();
      return (
        (!query ||
          String(ticket.id).toLowerCase().includes(query) ||
          (ticket.subject && ticket.subject.toLowerCase().includes(query))) &&
        (!statusFilter || ticket.status === statusFilter)
      );
    });

    return [...filtered].sort((left, right) => {
      const difference = new Date(left.createdAt) - new Date(right.createdAt);
      return sortOrder === "asc" ? difference : -difference;
    });
  }, [tickets, searchQuery, statusFilter, sortOrder]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-300">
          Author workspace
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">
              My Tickets
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Track your support requests and read replies from the BookLeaf
              team.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadTickets(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4 text-sm text-rose-200"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => loadTickets()}
              className="mt-2 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {!selectedTicketId && (
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search tickets by ID or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111d30] pl-10 pr-10 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400 placeholder:text-slate-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {!selectedTicketId && (
        <label className="block max-w-xs">
          <span className="mb-2 block text-xs font-medium text-slate-400">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111d30] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400"
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
      )}

      {!selectedTicketId && (
        <label className="block max-w-xs">
          <span className="mb-2 block text-xs font-medium text-slate-400">
            Sort by
          </span>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111d30] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
      )}

      {selectedTicketId ? (
        <section className="space-y-5">
          <button
            type="button"
            onClick={() => {
              navigate("/author/tickets");
              setTicketDetails(null);
              setDetailsError("");
            }}
            className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200"
          >
            <ArrowLeft size={16} />
            Back to My Tickets
          </button>

          {detailsLoading || (!displayedTicketDetails && !currentDetailsError) ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-6 text-sm text-slate-400">
              Loading ticket details...
            </div>
          ) : currentDetailsError && !displayedTicketDetails ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4 text-sm text-rose-200"
            >
              {currentDetailsError}
            </div>
          ) : displayedTicketDetails ? (
            <>
              <article className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="break-all text-xs text-slate-500">
                      Ticket ID: {displayedTicketDetails.id}
                    </p>

                    <h3 className="mt-2 break-words text-xl font-semibold text-slate-100">
                      {displayedTicketDetails.subject || "Support request"}
                    </h3>

                    <p className="mt-2 text-xs text-slate-500">
                      Submitted {formatDate(displayedTicketDetails.createdAt)}
                    </p>
                  </div>

                  <StatusBadge value={displayedTicketDetails.status} />
                </div>

                <div className="mt-5 flex flex-wrap gap-4 border-y border-white/[0.07] py-4">
                  <p className="text-sm text-slate-400">
                    Category:{" "}
                    <span className="text-slate-200">
                      {formatLabel(displayedTicketDetails.category)}
                    </span>
                  </p>

                  <PriorityBadge value={displayedTicketDetails.priority} />
                </div>

                <div className="pt-5">
                  <h4 className="text-sm font-semibold text-slate-200">
                    Your original query
                  </h4>

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                    {displayedTicketDetails.description ||
                      "No description was returned."}
                  </p>
                </div>

                {displayedTicketDetails.book && (
                  <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#0b1627] p-4">
                    <p className="text-xs text-slate-500">Related book</p>
                    <p className="mt-1 font-medium text-slate-200">
                      {displayedTicketDetails.book.title || "Book"}
                    </p>
                    {displayedTicketDetails.book.isbn && (
                      <p className="mt-1 text-xs text-slate-500">
                        ISBN: {displayedTicketDetails.book.isbn}
                      </p>
                    )}
                  </div>
                )}
              </article>

              <article className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
                    <MessageSquare size={19} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-100">
                      Support conversation
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Replies from the support team
                    </p>
                  </div>
                </div>

                {visibleMessages.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#0b1627] p-5">
                    <Clock3 size={19} className="text-slate-500" />
                    <p className="mt-3 text-sm text-slate-300">
                      No support response yet.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Replies will appear here automatically when available.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {visibleMessages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4"
                      >
                        <div className="flex flex-wrap justify-between gap-2">
                          <p className="text-sm font-medium text-emerald-200">
                            Support team
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatDate(message.createdAt)}
                          </p>
                        </div>

                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                          {message.content ||
                            message.body ||
                            message.message ||
                            ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </>
          ) : null}
        </section>
      ) : (
        <section className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-8 text-sm text-slate-400">
              Loading your tickets...
            </div>
          ) : tickets.length === 0 && !error ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-10 text-center">
              <Ticket className="mx-auto text-slate-500" size={32} />

              <h3 className="mt-4 font-semibold text-slate-200">
                No tickets found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Your submitted support requests will appear here.
              </p>

              <a
                href="/author/tickets/new"
                className="mt-5 inline-flex rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Create a ticket
              </a>
            </div>
          ) : visibleTickets.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-10 text-center">
              <Search className="mx-auto text-slate-500" size={32} />
              <h3 className="mt-4 font-semibold text-slate-200">
                No matching tickets
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different ticket ID, subject or status.
              </p>
            </div>
          ) : (
            visibleTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => navigate(`/author/tickets/${ticket.id}`)}
                className="w-full rounded-2xl border border-white/[0.07] bg-[#111d30] p-5 text-left transition hover:border-indigo-400/30 hover:bg-[#142136] sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="break-all text-xs text-slate-500">
                      Ticket ID: {ticket.id}
                    </p>

                    <h3 className="mt-2 break-words font-semibold text-slate-100">
                      {ticket.subject || "Support request"}
                    </h3>

                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                      {ticket.description || "No description available."}
                    </p>
                  </div>

                  <StatusBadge value={ticket.status} />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/[0.07] pt-4">
                  <span className="text-xs text-slate-400">
                    {formatLabel(ticket.category)}
                  </span>

                  <PriorityBadge value={ticket.priority} />

                  <span className="text-xs text-slate-500">
                    {formatDate(ticket.createdAt)}
                  </span>

                  <span className="ml-auto text-xs font-medium text-indigo-300">
                    View details →
                  </span>
                </div>
              </button>
            ))
          )}
        </section>
      )}
    </div>
  );
}
