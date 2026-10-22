import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  LifeBuoy,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Brand from "../components/Brand";
import FeatureCard from "../components/FeatureCard";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login({ email, password });

      navigate(user.role === "ADMIN" ? "/admin" : "/author", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1220] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.07] bg-[#101b2d] p-12 lg:flex xl:p-16">
          <div className="absolute -left-28 top-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-teal-400/[0.07] blur-3xl" />

          <Brand />

          <div className="relative max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/[0.07] px-3 py-1.5 text-xs font-medium text-indigo-200">
              <Sparkles size={14} />
              Author support, made clearer
            </span>

            <h1 className="mt-7 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Your publishing journey.
              <span className="mt-2 block text-indigo-300">
                One place to manage it.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              Track your books, understand your royalties, and stay connected
              with the BookLeaf support team.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3">
              <FeatureCard
                icon={BookOpen}
                title="Book overview"
                description="Publishing and royalty details"
              />
              <FeatureCard
                icon={LifeBuoy}
                title="Support tickets"
                description="Clear updates and replies"
              />
            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            BookLeaf Publishing · Author Support Portal
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Brand />
            </div>

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-200">
                <LockKeyhole size={22} />
              </div>

              <p className="text-sm font-medium text-indigo-300">
                Welcome to BookLeaf
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Sign in to your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Access your publishing dashboard and support workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-[#111d30] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-400/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-xs text-indigo-300 hover:text-indigo-200"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-[#111d30] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-400/10"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-400 px-4 py-3.5 text-sm font-semibold text-[#10152a] transition hover:bg-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/2.5 p-4">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-teal-300"
              />
              <p className="text-xs leading-5 text-slate-400">
                Secure, role-based access for BookLeaf authors and
                administrators.
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-slate-600">
              BookLeaf Publishing · Author Support Portal
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
