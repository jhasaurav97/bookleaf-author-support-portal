import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, Store } from "lucide-react";
import { api } from "../services/api";

const formatMoney = (value) => {
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
};

const formatDate = (value) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Metric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.07] bg-[#0b1627] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const value = status || "UNKNOWN";

  const styles = {
    PUBLISHED: "bg-emerald-400/10 text-emerald-300",
    "PUBLISHED & LIVE": "bg-emerald-400/10 text-emerald-300",
    IN_PRODUCTION: "bg-amber-400/10 text-amber-300",
    "IN PRODUCTION": "bg-amber-400/10 text-amber-300",
  };

  const className =
    styles[value.toUpperCase()] || "bg-slate-400/10 text-slate-300";

  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

export default function AuthorBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBooks() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/author/books");
        const result = response.data?.data;
        const authorBooks = result?.books;

        if (!Array.isArray(authorBooks)) {
          throw new Error("The server returned an unexpected books response.");
        }

        if (active) setBooks(authorBooks);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load your books. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBooks();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-300">
          Author workspace
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-100">My Books</h2>
        <p className="mt-2 text-sm text-slate-400">
          View your book details, publication status, sales and royalty
          information.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4 text-sm text-rose-200"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 font-medium underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-8 text-sm text-slate-400">
          Loading your books…
        </div>
      ) : !error && books.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-10 text-center">
          <BookOpen className="mx-auto text-slate-500" size={30} />
          <h3 className="mt-4 font-semibold text-slate-200">No books found</h3>
          <p className="mt-2 text-sm text-slate-500">
            No books are currently linked to your author account.
          </p>
        </div>
      ) : !error ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              Your catalogue
              <span className="ml-2 rounded-full bg-white/6 px-2.5 py-1 text-slate-200">
                {books.length}
              </span>
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {books.map((book) => (
              <article
                key={book.id}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111d30]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] p-5">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-200">
                      <BookOpen size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="wrap-break-word font-semibold text-slate-100">
                        {book.title || "Untitled book"}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {book.genre || "Genre not set"}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        ISBN: {book.isbn || "Not assigned"}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={book.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                  <Metric
                    label="Publication date"
                    value={formatDate(book.publicationDate)}
                  />
                  <Metric label="MRP" value={formatMoney(book.mrp)} />
                  <Metric
                    label="Copies sold"
                    value={Number(book.totalCopiesSold || 0).toLocaleString(
                      "en-IN",
                    )}
                  />
                  <Metric
                    label="Total royalty earned"
                    value={formatMoney(book.totalRoyaltyEarned)}
                  />
                  <Metric
                    label="Royalty per copy"
                    value={formatMoney(book.authorRoyaltyPerCopy)}
                  />
                  <Metric
                    label="Last payout"
                    value={formatDate(book.lastRoyaltyPayoutDate)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 px-5 pb-5">
                  <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                    <p className="text-xs text-slate-400">Royalty paid</p>
                    <p className="mt-2 wrap-break-word font-semibold text-emerald-200">
                      {formatMoney(book.royaltyPaid)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-4">
                    <p className="text-xs text-slate-400">Royalty pending</p>
                    <p className="mt-2 wrap-break-word font-semibold text-amber-200">
                      {formatMoney(book.royaltyPending)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/[0.07] px-5 py-4">
                  <p className="flex items-center gap-2 text-sm text-slate-300">
                    <Store size={16} className="shrink-0 text-indigo-300" />
                    <span className="text-slate-500">Print partner:</span>
                    {book.printPartner || "Not assigned"}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">Available on</p>

                  <p className="mt-1 wrap-break-word text-sm text-slate-300">
                    {Array.isArray(book.availableOn) &&
                    book.availableOn.length > 0
                      ? book.availableOn.join(" · ")
                      : "No distribution platforms listed"}
                  </p>

                  <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays size={14} />
                    Publication and royalty information shown as provided by the
                    server.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}