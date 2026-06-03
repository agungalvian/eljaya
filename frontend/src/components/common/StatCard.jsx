export function StatCard({ label, value, sub, icon: Icon, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-50 text-slate-600',
  };
  const textMap = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    slate: 'text-slate-700',
  };

  return (
    <div className="card p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 truncate">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold mt-1 truncate ${textMap[color]}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl flex-shrink-0 ${colorMap[color]}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}

export function ProgressBar({ label, value, total, color = 'amber' }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const colorClass = {
    amber: 'bg-amber-500',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-500',
  }[color] || 'bg-amber-500';

  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div className={`${colorClass} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
