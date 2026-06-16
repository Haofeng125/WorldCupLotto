import { StatusBadge, money } from '../ui.jsx';

function legText(leg) {
  const parts = [...leg.plays.filter((p) => p !== '其他')];
  if (leg.plays.some((p) => p.startsWith('让')) && leg.handicap) parts.push(`让球${leg.handicap}`);
  if (leg.plays.includes('其他') && leg.other_text) parts.push(`其他: ${leg.other_text}`);
  return parts;
}

export default function BetCard({ bet, showUser, onSettle, onEdit, onDelete }) {
  return (
    <div className="card p-4 fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {showUser && <span className="font-bold">{bet.username}</span>}
          <StatusBadge status={bet.status} />
          {bet.legs.length > 1 && (
            <span className="text-xs text-white/50">{bet.legs.length} 场串关</span>
          )}
        </div>
        <div className="text-right text-sm">
          <div className="text-white/60">本金 {money(bet.stake)}</div>
          {bet.status === 'won' && <div className="text-gold-400 font-bold">奖金 {money(bet.payout)}</div>}
        </div>
      </div>

      <div className="space-y-2">
        {bet.legs.map((leg) => (
          <div key={leg.id ?? `${leg.home_team}-${leg.away_team}`} className="rounded-xl bg-black/20 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {leg.home_team} <span className="text-white/40">vs</span> {leg.away_team}
              </span>
              {leg.match_date && <span className="text-xs text-white/40">{leg.match_date}</span>}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {legText(leg).map((t, i) => (
                <span key={i} className="rounded-md bg-pitch-600/60 px-2 py-0.5 text-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {bet.note && <p className="mt-2 text-xs text-white/50">备注：{bet.note}</p>}

      {(onSettle || onEdit || onDelete) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onSettle && (
            <button onClick={() => onSettle(bet)} className="btn-green flex-1 py-2 text-sm">
              结算
            </button>
          )}
          {onEdit && (
            <button onClick={() => onEdit(bet)} className="btn-ghost flex-1 py-2 text-sm">
              修改
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(bet)} className="btn-danger flex-1 py-2 text-sm">
              删除
            </button>
          )}
        </div>
      )}
    </div>
  );
}
