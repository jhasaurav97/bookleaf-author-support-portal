export default function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-4">
      <Icon size={19} className="text-teal-300" />
      <p className="mt-4 text-sm font-medium text-slate-200">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
