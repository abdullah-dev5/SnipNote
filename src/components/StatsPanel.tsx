import type { NoteStats } from '../utils/filter';

interface StatsPanelProps {
  stats: NoteStats;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <Stat label="Active" value={stats.active} />
      <Stat label="This week" value={stats.thisWeek} />
      <Stat label="Starred" value={stats.starred} />
      <Stat label="Pinned" value={stats.pinned} />
      <Stat label="Archived" value={stats.archived} />
      <Stat label="Total" value={stats.total} />

      {stats.topDomains.length > 0 && (
        <div className="col-span-full rounded-lg border border-white/5 p-2">
          <p className="text-[10px] uppercase text-slate-500 mb-1">Top domains</p>
          {stats.topDomains.map(({ domain, count }) => (
            <div key={domain} className="flex justify-between text-xs text-slate-300">
              <span className="truncate">{domain}</span>
              <span className="text-slate-500">{count}</span>
            </div>
          ))}
        </div>
      )}

      {stats.topTags.length > 0 && (
        <div className="col-span-full rounded-lg border border-white/5 p-2">
          <p className="text-[10px] uppercase text-slate-500 mb-1">Top tags</p>
          <div className="flex flex-wrap gap-1">
            {stats.topTags.map(({ tag, count }) => (
              <span key={tag} className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">
                #{tag} ({count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center">
      <p className="text-lg font-bold text-violet-300">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}
