import { BookOpen } from "lucide-react";

export default function Brand() {
  return (
    <div className="relative flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400 text-[#10152a]">
        <BookOpen size={23} strokeWidth={2.2} />
      </div>
      <div>
        <p className="text-lg font-semibold tracking-tight">BookLeaf</p>
        <p className="text-xs text-slate-400">Author Support Portal</p>
      </div>
    </div>
  );
}
