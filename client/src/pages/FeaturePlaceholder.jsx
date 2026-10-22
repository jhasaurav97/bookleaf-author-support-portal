export default function FeaturePlaceholder({ title, description }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#111d30] p-6 sm:p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
        {description}
      </p>
      <div className="mt-6 rounded-xl border border-indigo-300/10 bg-indigo-300/4 p-4 text-sm text-indigo-200">
        This page is ready for API integration in the next step.
      </div>
    </section>
  );
}
