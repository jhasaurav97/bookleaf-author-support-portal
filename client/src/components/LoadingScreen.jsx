export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-sm text-slate-400">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-teal-300" />
        Loading your workspace...
      </div>
    </div>
  );
}
