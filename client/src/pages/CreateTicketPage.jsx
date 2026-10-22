import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { api } from "../services/api";

export default function CreateTicketPage() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [loadingBooks, setLoadingBooks] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadBooks() {
      try {
        const response = await api.get("/author/books");
        const authorBooks = response.data?.data?.books;

        if (!Array.isArray(authorBooks)) {
          throw new Error("Unexpected books response from the server.");
        }

        if (active) setBooks(authorBooks);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load your books. You can still try a general query.",
          );
        }
      } finally {
        if (active) setLoadingBooks(false);
      }
    }

    loadBooks();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();

    if (!cleanSubject || !cleanDescription) {
      setError("Please enter both a subject and a detailed description.");
      return;
    }

    if (cleanSubject.length < 5) {
      setError("Subject must contain at least 5 characters.");
      return;
    }

    if (cleanDescription.length < 20) {
      setError("Please provide at least 20 characters in the description.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/tickets", {
        bookId: bookId || null,
        subject: cleanSubject,
        description: cleanDescription,
      });

      const result = response.data?.data;

      setSuccess({
        message: response.data?.message || "Your support ticket was submitted.",
        ticketId: result?.ticket?.id || result?.id || null,
      });

      setSubject("");
      setDescription("");
      setBookId("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit your ticket. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-emerald-400/20 bg-[#111d30] p-8">
        <CheckCircle2 size={38} className="text-emerald-300" />

        <h2 className="mt-4 text-xl font-semibold text-slate-100">
          Ticket submitted successfully
        </h2>

        <p className="mt-2 text-sm text-slate-400">{success.message}</p>

        {success.ticketId && (
          <p className="mt-3 text-sm text-slate-300">
            Ticket ID: <span className="font-semibold">{success.ticketId}</span>
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Create another ticket
          </button>

          <button
            type="button"
            onClick={() => navigate("/author/tickets")}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5"
          >
            View my tickets
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-300">
          Author workspace
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-slate-100">
          Create Support Ticket
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Describe your issue clearly so the BookLeaf support team can help.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4 text-sm text-rose-200"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-white/[0.07] bg-[#111d30] p-6 sm:p-8"
      >
        <div>
          <label
            htmlFor="bookId"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Book / General or Account-Level Query
          </label>

          <select
            id="bookId"
            value={bookId}
            onChange={(event) => setBookId(event.target.value)}
            disabled={loadingBooks}
            className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 disabled:opacity-60"
          >
            <option value="">
              {loadingBooks
                ? "Loading your books..."
                : "General / Account-Level Query"}
            </option>

            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} {book.isbn ? `(${book.isbn})` : ""}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-slate-500">
            Select a book for a book-specific issue, or leave the general option
            selected for an account-level query.
          </p>
        </div>

        <div>
          <label
            htmlFor="subject"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Subject <span className="text-rose-300">*</span>
          </label>

          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            minLength={5}
            maxLength={200}
            required
            placeholder="e.g. Royalty payment discrepancy"
            className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400"
          />

          <p className="mt-1 text-right text-xs text-slate-500">
            {subject.length}/200
          </p>
        </div>
        <div className="mt-5">
          <label
            htmlFor="attachments"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Attachments (Optional)
          </label>
          <div className="flex flex-col gap-3">
            <input
              id="attachments"
              type="file"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files);
                setAttachments(files);
              }}
              className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm text-slate-100 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-400 cursor-pointer"
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-300 border border-white/10"
                  >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 italic">
              Note: File upload is currently simulated. Files are selected in the UI but not stored on the server.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Detailed Description <span className="text-rose-300">*</span>
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={20}
            maxLength={5000}
            rows={7}
            required
            placeholder="Explain the issue, relevant dates, amounts, and what you need help with..."
            className="w-full resize-y rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400"
          />

          <p className="mt-1 text-right text-xs text-slate-500">
            {description.length}/5000
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <Send size={16} />
          {submitting ? "Submitting..." : "Submit Support Ticket"}
        </button>
      </form>
    </div>
  );
}
