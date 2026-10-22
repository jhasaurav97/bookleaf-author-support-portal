import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BookOpen,
  CircleUserRound,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Ticket,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Brand from "./Brand";

const authorNav = [
  { label: "Overview", to: "/author", icon: LayoutDashboard, end: true },
  { label: "My Books", to: "/author/books", icon: BookOpen },
  { label: "My Tickets", to: "/author/tickets", icon: Ticket },
  { label: "Create Ticket", to: "/author/tickets/new", icon: LifeBuoy },
];

const adminNav = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Ticket Queue", to: "/admin/tickets", icon: Ticket },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAdmin = user.role === "ADMIN";
  const navItems = isAdmin ? adminNav : authorNav;
  const activeItem = navItems.find((item) => item.to === location.pathname);
  const title =
    activeItem?.label || (isAdmin ? "Ticket Details" : "Ticket Details");

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 md:flex">
      <aside className="flex w-full flex-col border-b border-white/[0.07] bg-[#101b2d] p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <Brand />

        <div className="mt-9 rounded-xl border border-white/[0.07] bg-white/2.5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Signed in as
          </p>
          <p className="mt-2 truncate text-sm font-medium">{user.name}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-300/10 px-2.5 py-1 text-xs text-teal-200">
            <CircleUserRound size={13} />
            {user.role}
          </span>
        </div>

        <nav className="mt-7 flex gap-2 overflow-x-auto md:flex-col">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  isActive
                    ? "bg-indigo-400/10 font-medium text-indigo-200"
                    : "text-slate-400 hover:bg-white/4 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="mt-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200 md:mt-auto"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-8 xl:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
              {isAdmin ? "Administration" : "Author workspace"}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#111d30] px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-200">
              <CircleUserRound size={17} />
            </div>
            <div>
              <p className="text-xs font-medium">{user.name}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {isAdmin ? "Support team" : "Author account"}
              </p>
            </div>
          </div>
        </header>

        <div className="mt-8">
          <Outlet />
        </div>

        <p className="mt-8 text-xs text-slate-600">
          BookLeaf Publishing · Author Support Portal
        </p>
      </main>
    </div>
  );
}
