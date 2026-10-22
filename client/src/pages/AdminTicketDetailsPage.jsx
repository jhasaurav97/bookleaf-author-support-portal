import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  MessageSquare,
  RefreshCw,
  Send,
  UserRoundCheck,
} from "lucide-react";
import { api } from "../services/api";

const STATUSES = [
  ["OPEN", "Open"],
  ["IN_PROGRESS", "In progress"],
  ["RESOLVED", "Resolved"],
  ["CLOSED", "Closed"],
];

const PRIORITIES = [
  ["CRITICAL", "Critical"],
  ["HIGH", "High"],
  ["MEDIUM", "Medium"],
  ["LOW", "Low"],
];

const CATEGORIES = [
  ["ROYALTY_PAYMENTS", "Royalty payments"],
  ["ISBN_METADATA", "ISBN metadata"],
  ["PRINTING_QUALITY", "Printing quality"],
  ["DISTRIBUTION_AVAILABILITY", "Distribution availability"],
  ["BOOK_STATUS_PRODUCTION", "Book status / production"],
  ["GENERAL_INQUIRY", "General inquiry"],
];

function label(value) {
  return value ? String(value).replaceAll("_", " ") : "Not specified";
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Not available";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function normalizeDetails(response) {
  const payload = response.data?.data;
  const ticket =
    payload?.ticket ?? payload?.data?.ticket ?? payload?.data ?? payload;

  if (!ticket || !ticket.id) {
    throw new Error("Ticket details were not returned in the expected format.");
  }

  return {
    ...ticket,
    aiDraft: payload?.aiDraft ?? ticket.aiDraft ?? "",
    aiError: payload?.aiError ?? ticket.aiError ?? "",
    aiStatus: payload?.aiStatus ?? ticket.aiStatus ?? "",
    messages: Array.isArray(ticket.messages) ? ticket.messages : [],
  };
}

function Field({ label: fieldLabel, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-400">
        {fieldLabel}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-400"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoMetric({ label: metricLabel, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.07] bg-[#0b1627] p-3">
      <p className="text-xs text-slate-500">{metricLabel}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-200">
        {value ?? "Not available"}
      </p>
    </div>
  );
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

export default function AdminTicketDetailsPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const initializedTicket = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [sendingNote, setSendingNote] = useState(false);

  const [status, setStatus] = useState("OPEN");
  const [category, setCategory] = useState("GENERAL_INQUIRY");
  const [priority, setPriority] = useState("MEDIUM");
  const [replyContent, setReplyContent] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTicket = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
          setError("");
        }

        const response = await api.get(`/admin/tickets/${ticketId}`);
        const result = normalizeDetails(response);

        setTicket(result);

        // Only initialize the editable fields when opening a different ticket.
        // Background refreshes must not overwrite text currently being edited.
        if (initializedTicket.current !== ticketId) {
          initializedTicket.current = ticketId;
          setStatus(result.status || "OPEN");
          setCategory(result.category || "GENERAL_INQUIRY");
          setPriority(result.priority || "MEDIUM");
          setReplyContent(result.aiDraft || "");
          setInternalNote("");
        }

        setError("");
      } catch (err) {
        if (!silent) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load ticket details.",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [ticketId],
  );

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      initializedTicket.current = null;

      setTicket(null);
      setError("");
      setActionError("");
      setNotice("");

      void loadTicket();
    }, 0);

    const refreshTimer = setInterval(() => {
      void loadTicket(true);
    }, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(refreshTimer);
    };
  }, [loadTicket]);

  async function handleSaveMetadata(event) {
    event.preventDefault();
    setActionError("");
    setNotice("");

    setSavingMetadata(true);

    try {
      await api.patch(`/admin/tickets/${ticketId}`, {
        status,
        category,
        priority,
      });

      setNotice("Ticket status, category and priority updated.");
      await loadTicket(true);
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Unable to update ticket details. Check the selected values.",
      );
    } finally {
      setSavingMetadata(false);
    }
  }

  async function handleAssignToMe() {
    setActionError("");
    setNotice("");
    setAssigning(true);

    try {
      await api.post(`/admin/tickets/${ticketId}/assign-to-me`);

      setNotice("Ticket assigned to you.");
      await loadTicket(true);
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Unable to assign this ticket to you.",
      );
    } finally {
      setAssigning(false);
    }
  }

  async function handleSendMessage(type) {
    const isReply = type === "RESPONSE";
    const content = (isReply ? replyContent : internalNote).trim();

    setActionError("");
    setNotice("");

    if (!content) {
      setActionError(
        isReply
          ? "Enter a reply before sending."
          : "Enter an internal note before saving.",
      );
      return;
    }

    if (content.length > 5000) {
      setActionError("The message cannot exceed 5,000 characters.");
      return;
    }

    if (isReply) {
      setSendingReply(true);
    } else {
      setSendingNote(true);
    }

    try {
      await api.post(`/admin/tickets/${ticketId}/messages`, {
        content,
        type,
      });

      if (isReply) {
        setReplyContent("");
        setNotice("Public reply sent to the author.");
      } else {
        setInternalNote("");
        setNotice("Internal note saved. It is not visible to the author.");
      }

      await loadTicket(true);
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          `Unable to ${isReply ? "send the reply" : "save the note"}.`,
      );
    } finally {
      setSendingReply(false);
      setSendingNote(false);
    }
  }

  const messages = ticket?.messages || [];
  const book = ticket?.book || null;

  const authorName =
    ticket?.author?.name ||
    ticket?.author?.fullName ||
    ticket?.authorName ||
    "Author";

  const authorEmail = ticket?.author?.email || "";

  if (loading && !ticket) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-8 text-sm text-slate-400">
        Loading ticket details...
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/admin/tickets")}
          className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200"
        >
          <ArrowLeft size={16} />
          Back to Ticket Queue
        </button>

        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-5 text-sm text-rose-200"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => loadTicket()}
            className="mt-3 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-300">
          Administration
        </p>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">
              Ticket Details
            </h2>

            <p className="mt-2 break-all text-xs text-slate-500">
              Ticket ID: {ticket.id}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge value={ticket.status} />

            <button
              type="button"
              onClick={() => loadTicket(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <button
        type="button"
        onClick={() => navigate("/admin/tickets")}
        className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200"
      >
        <ArrowLeft size={16} />
        Back to Ticket Queue
      </button>

      {(error || actionError) && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4 text-sm text-rose-200"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{actionError || error}</p>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-sm text-emerald-200"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      )}

      <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="break-words text-xl font-semibold text-slate-100">
              {ticket.subject || "Support request"}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Submitted {formatDate(ticket.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAssignToMe}
            disabled={assigning}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/20 px-4 py-2.5 text-sm font-medium text-indigo-200 hover:bg-indigo-400/10 disabled:opacity-60"
          >
            <UserRoundCheck size={16} />
            {assigning ? "Assigning..." : "Assign to me"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 border-y border-white/[0.07] py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Author</p>
            <p className="mt-1 font-medium text-slate-200">{authorName}</p>
            {authorEmail && (
              <p className="mt-1 break-all text-sm text-slate-400">
                {authorEmail}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-500">Assigned to</p>
            <p className="mt-1 font-medium text-slate-200">
              {ticket.assignedTo?.name ||
                ticket.assignedTo?.fullName ||
                ticket.assignedToName ||
                "Unassigned"}
            </p>
          </div>
        </div>

        <div className="pt-5">
          <h4 className="text-sm font-semibold text-slate-200">
            Original query
          </h4>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
            {ticket.description || "No description available."}
          </p>
        </div>
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-slate-200">
            Attachments
          </h4>
          <p className="mt-3 rounded-xl border border-white/[0.07] bg-[#0b1627] p-4 text-sm text-slate-400">
            No attachments available for this ticket.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
            <BookOpen size={19} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">Book details</h3>
            <p className="mt-1 text-xs text-slate-500">
              Book and royalty information attached to this ticket
            </p>
          </div>
        </div>

        {!book ? (
          <p className="mt-5 rounded-xl border border-white/[0.07] bg-[#0b1627] p-4 text-sm text-slate-400">
            This is a general/account-level query with no linked book.
          </p>
        ) : (
          <>
            <div className="mt-5">
              <h4 className="break-words text-lg font-semibold text-slate-100">
                {book.title || "Untitled book"}
              </h4>
              <p className="mt-1 break-all text-sm text-slate-400">
                ISBN: {book.isbn || "Not assigned"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {book.genre || "Genre not set"} · {label(book.status)}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <InfoMetric label="MRP" value={money(book.mrp)} />
              <InfoMetric
                label="Copies sold"
                value={
                  book.totalCopiesSold == null
                    ? "Not available"
                    : Number(book.totalCopiesSold).toLocaleString("en-IN")
                }
              />
              <InfoMetric
                label="Royalty per copy"
                value={money(book.authorRoyaltyPerCopy)}
              />
              <InfoMetric
                label="Total royalty earned"
                value={money(book.totalRoyaltyEarned)}
              />
              <InfoMetric
                label="Royalty paid"
                value={money(book.royaltyPaid)}
              />
              <InfoMetric
                label="Royalty pending"
                value={money(book.royaltyPending)}
              />
              <InfoMetric
                label="Publication date"
                value={
                  book.publicationDate
                    ? formatDate(book.publicationDate)
                    : "Not set"
                }
              />
              <InfoMetric
                label="Last payout"
                value={
                  book.lastRoyaltyPayoutDate
                    ? formatDate(book.lastRoyaltyPayoutDate)
                    : "Not set"
                }
              />
            </div>

            <div className="mt-4 grid gap-4 border-t border-white/[0.07] pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Print partner</p>
                <p className="mt-1 text-sm text-slate-200">
                  {book.printPartner || "Not assigned"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Distribution platforms</p>
                <p className="mt-1 break-words text-sm text-slate-200">
                  {Array.isArray(book.availableOn) &&
                  book.availableOn.length > 0
                    ? book.availableOn.join(" · ")
                    : "Not listed"}
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-5 sm:p-6">
        <h3 className="font-semibold text-slate-100">Manage ticket</h3>
        <p className="mt-1 text-sm text-slate-400">
          Update the status, category or priority. Changes are saved to the
          backend.
        </p>

        <form onSubmit={handleSaveMetadata} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Status"
              value={status}
              options={STATUSES}
              onChange={setStatus}
            />

            <Field
              label="Category"
              value={category}
              options={
                CATEGORIES.some(([value]) => value === category)
                  ? CATEGORIES
                  : [[category, label(category)], ...CATEGORIES]
              }
              onChange={setCategory}
            />

            <Field
              label="Priority"
              value={priority}
              options={PRIORITIES}
              onChange={setPriority}
            />
          </div>

          <button
            type="submit"
            disabled={savingMetadata}
            className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingMetadata ? "Saving changes..." : "Save ticket changes"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
            <MessageSquare size={19} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">
              AI-assisted public reply
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Review and edit the draft before sending. The author sees the
              message only after you send it.
            </p>
          </div>
        </div>

        {ticket.aiError && (
          <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm text-amber-200">
            AI draft generation was unavailable for this ticket. You can write a
            reply manually below.
          </div>
        )}

        <label
          htmlFor="publicReply"
          className="mb-2 mt-5 block text-sm font-medium text-slate-200"
        >
          Reply to author
        </label>

        <textarea
          id="publicReply"
          value={replyContent}
          onChange={(event) => setReplyContent(event.target.value)}
          rows={8}
          maxLength={5000}
          placeholder="Review the AI draft or write a response manually..."
          className="w-full resize-y rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Check dates, amounts and next steps before sending. Do not promise
            an unverified payout date.
          </p>
          <span className="text-xs text-slate-500">
            {replyContent.length}/5000
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSendMessage("RESPONSE")}
          disabled={sendingReply || !replyContent.trim()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={15} />
          {sendingReply ? "Sending reply..." : "Send public reply"}
        </button>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-5 sm:p-6">
        <h3 className="font-semibold text-slate-100">Internal note</h3>
        <p className="mt-1 text-sm text-slate-400">
          For internal coordination only. This note must not be shown to the
          author.
        </p>

        <textarea
          value={internalNote}
          onChange={(event) => setInternalNote(event.target.value)}
          rows={4}
          maxLength={5000}
          placeholder="Add investigation notes, handover details, or internal follow-up..."
          className="mt-5 w-full resize-y rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400"
        />

        <div className="mt-2 flex justify-end">
          <span className="text-xs text-slate-500">
            {internalNote.length}/5000
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSendMessage("INTERNAL_NOTE")}
          disabled={sendingNote || !internalNote.trim()}
          className="mt-3 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sendingNote ? "Saving note..." : "Save internal note"}
        </button>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-5 sm:p-6">
        <h3 className="font-semibold text-slate-100">Conversation history</h3>
        <p className="mt-1 text-sm text-slate-400">
          Public replies and internal notes for admin review.
        </p>

        {messages.length === 0 ? (
          <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#0b1627] p-5 text-sm text-slate-400">
            No messages have been recorded for this ticket yet.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {messages.map((message) => {
              const isInternal = message.type === "INTERNAL_NOTE";
              const sender =
                message.sender?.name ||
                message.sender?.fullName ||
                message.senderName ||
                (message.senderRole === "AUTHOR" ? authorName : "Support team");

              return (
                <article
                  key={message.id}
                  className={`rounded-xl border p-4 ${
                    isInternal
                      ? "border-amber-400/15 bg-amber-400/[0.04]"
                      : "border-emerald-400/10 bg-emerald-400/[0.03]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          isInternal ? "text-amber-200" : "text-emerald-200"
                        }`}
                      >
                        {sender}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {isInternal
                          ? "Internal note · Admin only"
                          : "Public message"}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                    {message.content || message.body || message.message || ""}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock3 size={14} />
        Ticket details and conversation refresh automatically every five
        seconds.
      </div>
    </div>
  );
}
