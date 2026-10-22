import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Ticket,
} from "lucide-react";
import { api } from "../services/api";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  ["OPEN", "Open"],
  ["IN_PROGRESS", "In progress"],
  ["RESOLVED", "Resolved"],
  ["CLOSED", "Closed"],
];

const PRIORITY_OPTIONS = [
  ["CRITICAL", "Critical"],
  ["HIGH", "High"],
  ["MEDIUM", "Medium"],
  ["LOW", "Low"],
];

function label(value) {
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

function ticketListFrom(response) {
  const payload = response.data?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.tickets)) return payload.tickets;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.tickets)) return payload.data.tickets;

  return null;
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
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || "bg-slate-400/10 text-slate-300"
      }`}
    >
      {label(status)}
    </span>
  );
}

function PriorityBadge({ value }) {
  const priority = String(value || "MEDIUM").toUpperCase();

  const styles = {
    CRITICAL: "bg-rose-400/10 text-rose-300",
    HIGH: "bg-orange-400/10 text-orange-300",
    MEDIUM: "bg-amber-400/10 text-amber-300",
    LOW: "bg-slate-400/10 text-slate-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[priority] || styles.MEDIUM
      }`}
    >
      {label(priority)}
    </span>
  );
}

function FilterSelect({ label: fieldLabel, value, options, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-medium text-slate-400">
        {fieldLabel}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-400"
      >
        <option value="">All</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AdminTicketsPage() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    fromDate: "",
    toDate: "",
    ticketId: "",
    sortOrder: "desc",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    status: "",
    category: "",
    priority: "",
    fromDate: "",
    toDate: "",
    ticketId: "",
    sortOrder: "desc",
  });

  const categoryOptions = useMemo(() => {
    const values = new Set();

    tickets.forEach((ticket) => {
      if (ticket.category) values.add(ticket.category);
    });

    if (appliedFilters.category) values.add(appliedFilters.category);

    return [...values].sort().map((value) => [value, label(value)]);
  }, [tickets, appliedFilters.category]);

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit: PAGE_SIZE,
        };

        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value) params[key] = value;
        });

        const response = await api.get("/admin/tickets", { params });
        const result = ticketListFrom(response);

        if (!result) {
          throw new Error(
            "Unexpected admin ticket response. Check the API response format.",
          );
        }

        const payload = response.data?.data;
        const pagination =
          payload?.pagination || payload?.data?.pagination || {};

        const returnedPage = Number(
          pagination.page ?? pagination.currentPage ?? page,
        );

        const returnedTotalPages = Number(
          pagination.totalPages ?? pagination.pages,
        );

        if (!active) return;

        setTickets(result);

        if (Number.isFinite(returnedTotalPages) && returnedTotalPages > 0) {
          setTotalPages(returnedTotalPages);
          setHasNextPage(returnedPage < returnedTotalPages);
        } else {
          setTotalPages(null);
          setHasNextPage(result.length === PAGE_SIZE);
        }

        setError("");
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load the admin ticket queue.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadTickets();

    return () => {
      active = false;
    };
  }, [page, appliedFilters, refreshKey]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleApplyFilters(event) {
    event.preventDefault();

    if (
      filters.fromDate &&
      filters.toDate &&
      filters.fromDate > filters.toDate
    ) {
      setError("The start date must be on or before the end date.");
      return;
    }

    setError("");
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function handleClearFilters() {
    const emptyFilters = {
      status: "",
      category: "",
      priority: "",
      fromDate: "",
      toDate: "",
      ticketId: "",
      sortOrder: "desc",
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
    setError("");
  }

  function handleRefresh() {
    setRefreshing(true);
    setRefreshKey((current) => current + 1);
  }

  function getPriority(ticket) {
    return String(ticket.priority || "MEDIUM").toUpperCase();
  }

  function isUnresolved(ticket) {
    return !["RESOLVED", "CLOSED"].includes(
      String(ticket.status || "").toUpperCase(),
    );
  }

  function needsAttention(ticket) {
    return (
      isUnresolved(ticket) && ["CRITICAL", "HIGH"].includes(getPriority(ticket))
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-300">
          Administration
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">
              Ticket Queue
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Review author queries, identify urgent cases and open tickets to
              manage responses.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      <form
        onSubmit={handleApplyFilters}
        className="space-y-4 rounded-2xl border border-white/[0.07] bg-[#111d30] p-5"
      >
        <div className="flex items-center gap-2">
          <Search size={17} className="text-indigo-300" />
          <h3 className="font-semibold text-slate-200">Filter tickets</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-slate-400">
                Ticket ID
              </span>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Search by ID..."
                  value={filters.ticketId}
                  onChange={(event) => updateFilter("ticketId", event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1627] pl-9 pr-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-400"
                />
              </div>
            </label>
          </div>
          <FilterSelect
            label="Status"
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(value) => updateFilter("status", value)}
          />

          <FilterSelect
            label="Category"
            value={filters.category}
            options={categoryOptions}
            onChange={(value) => updateFilter("category", value)}
          />

          <FilterSelect
            label="Priority"
            value={filters.priority}
            options={PRIORITY_OPTIONS}
            onChange={(value) => updateFilter("priority", value)}
          />

          <FilterSelect
            label="Sort by"
            value={filters.sortOrder}
            options={[["desc", "Newest first"], ["asc", "Oldest first"]]}
            onChange={(value) => updateFilter("sortOrder", value)}
          />

          <label>
            <span className="mb-2 block text-xs font-medium text-slate-400">
              From date
            </span>
            <input
              type="date"
              value={filters.fromDate}
              max={filters.toDate || undefined}
              onChange={(event) => updateFilter("fromDate", event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-400"
            />
          </label>

          <label>
            <span className="mb-2 block text-xs font-medium text-slate-400">
              To date
            </span>
            <input
              type="date"
              value={filters.toDate}
              min={filters.fromDate || undefined}
              onChange={(event) => updateFilter("toDate", event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-400"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Apply filters
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Clear filters
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4 text-sm text-rose-200"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p>{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-2 underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && tickets.some(needsAttention) && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.05] p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-300" />
          <div>
            <p className="text-sm font-semibold text-rose-200">
              Urgent tickets need attention
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Critical or high-priority tickets that are not resolved or closed
              are highlighted below.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-100">All tickets</h3>
          <p className="mt-1 text-xs text-slate-500">
            {loading
              ? "Loading queue..."
              : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} on this page`}
          </p>
        </div>

        <span className="text-xs text-slate-500">
          Page {page}
          {totalPages ? ` of ${totalPages}` : ""}
        </span>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-8 text-sm text-slate-400">
          Loading ticket queue...
        </div>
      ) : !error && tickets.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-10 text-center">
          <Ticket className="mx-auto text-slate-500" size={32} />
          <h3 className="mt-4 font-semibold text-slate-200">
            No matching tickets
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Try changing or clearing your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const priority = getPriority(ticket);
            const urgent = needsAttention(ticket);

            return (
              <article
                key={ticket.id}
                className={`rounded-2xl border bg-[#111d30] p-5 transition hover:bg-[#142136] sm:p-6 ${
                  priority === "CRITICAL" && isUnresolved(ticket)
                    ? "border-rose-400/40"
                    : urgent
                      ? "border-amber-400/25"
                      : "border-white/[0.07]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="break-all text-xs text-slate-500">
                      Ticket ID: {ticket.id}
                    </p>

                    <h4 className="mt-2 break-words font-semibold text-slate-100">
                      {ticket.subject || "Support request"}
                    </h4>

                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                      {ticket.description || "No description available."}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <StatusBadge value={ticket.status} />
                    <PriorityBadge value={ticket.priority} />
                  </div>
                </div>

                {urgent && (
                  <p className="mt-4 text-xs font-semibold text-rose-300">
                    Requires attention — {label(priority)} priority
                  </p>
                )}

                <div className="mt-5 grid gap-4 border-t border-white/[0.07] pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Author</p>
                    <p className="mt-1 text-sm text-slate-200">
                      {ticket.author?.name ||
                        ticket.authorName ||
                        ticket.author?.fullName ||
                        "Author"}
                    </p>
                    {ticket.author?.email && (
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {ticket.author.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Book / Category</p>
                    <p className="mt-1 text-sm text-slate-200">
                      {ticket.book?.title || "General inquiry"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {label(ticket.category)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                      <CalendarDays size={14} className="text-slate-500" />
                      {formatDate(ticket.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Assigned to</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {ticket.assignedTo?.name ||
                        ticket.assignedTo?.fullName ||
                        ticket.assignedToName ||
                        "Unassigned"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-end border-t border-white/[0.07] pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
                  >
                    Open ticket →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <button
          type="button"
          disabled={loading || (totalPages ? page >= totalPages : !hasNextPage)}
          onClick={() => setPage((current) => current + 1)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
