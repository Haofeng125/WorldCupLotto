import { useState } from 'react';
import { TEAMS } from '../teams.js';
import AgentCheckbox from './AgentCheckbox.jsx';

const PLAYS = ['胜', '平', '负', '让胜', '让平', '让负', '其他'];
const isHandicap = (p) => p.startsWith('让');

function emptyLeg() {
  return { home_team: '', away_team: '', match_date: '', plays: [], handicap: '', other_text: '' };
}

// initial: { stake, note, legs } — used both for new bets and editing existing ones
export default function BetForm({ initial, submitLabel, onSubmit, busy }) {
  const [stake, setStake] = useState(initial?.stake ? String(initial.stake) : '');
  const [note, setNote] = useState(initial?.note || '');
  const [agentBuy, setAgentBuy] = useState(!!initial?.agent_buy);
  const [legs, setLegs] = useState(
    initial?.legs?.length ? initial.legs.map((l) => ({ ...emptyLeg(), ...l })) : [emptyLeg()]
  );

  const updateLeg = (i, patch) => setLegs((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const togglePlay = (i, play) =>
    setLegs((ls) =>
      ls.map((l, idx) =>
        idx === i
          ? { ...l, plays: l.plays.includes(play) ? l.plays.filter((p) => p !== play) : [...l.plays, play] }
          : l
      )
    );
  const addLeg = () => setLegs((ls) => [...ls, emptyLeg()]);
  const removeLeg = (i) => setLegs((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)));

  function submit(e) {
    e.preventDefault();
    onSubmit({ stake: Number(stake), note, legs, simple: false, agent_buy: agentBuy });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {legs.map((leg, i) => {
        const showHandicap = leg.plays.some(isHandicap);
        const showOther = leg.plays.includes('其他');
        return (
          <div key={i} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gold-400">第 {i + 1} 场</span>
              {legs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLeg(i)}
                  className="text-red-300 text-sm active:scale-95"
                >
                  删除本场
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TeamSelect
                label="主队"
                value={leg.home_team}
                onChange={(v) => updateLeg(i, { home_team: v })}
              />
              <TeamSelect
                label="客队"
                value={leg.away_team}
                onChange={(v) => updateLeg(i, { away_team: v })}
              />
            </div>

            <div>
              <label className="text-xs text-white/50">购买日期</label>
              <input
                type="date"
                className="input mt-1"
                value={leg.match_date}
                onChange={(e) => updateLeg(i, { match_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs text-white/50">玩法（可多选）</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {PLAYS.map((p) => {
                  const active = leg.plays.includes(p);
                  return (
                    <span
                      key={p}
                      onClick={() => togglePlay(i, p)}
                      className={`chip ${
                        active
                          ? 'bg-gold-500 text-pitch-900 border-gold-400'
                          : 'bg-white/5 text-white/80 border-white/15'
                      }`}
                    >
                      {p}
                    </span>
                  );
                })}
              </div>
            </div>

            {showHandicap && (
              <div>
                <label className="text-xs text-white/50">让球个数（主队，如 -1 / +1）</label>
                <input
                  className="input mt-1"
                  placeholder="例如 -1"
                  value={leg.handicap}
                  onChange={(e) => updateLeg(i, { handicap: e.target.value })}
                />
              </div>
            )}

            {showOther && (
              <div>
                <label className="text-xs text-white/50">其他玩法（如比分 2:1、总进球等）</label>
                <input
                  className="input mt-1"
                  placeholder="请填写具体玩法"
                  value={leg.other_text}
                  onChange={(e) => updateLeg(i, { other_text: e.target.value })}
                />
              </div>
            )}
          </div>
        );
      })}

      <button type="button" onClick={addLeg} className="btn-ghost w-full border border-dashed border-white/20">
        ＋ 增加一场（串关）
      </button>

      <div className="card p-4 space-y-3">
        <div>
          <label className="text-xs text-white/50">投注金额（本金，元）</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            className="input mt-1"
            placeholder="本金"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-white/50">备注（可选）</label>
          <input
            className="input mt-1"
            placeholder="比如玩法说明"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <AgentCheckbox checked={agentBuy} onChange={setAgentBuy} label="🧧 高哥代买（买入提成 1 元）" />
      </div>

      <button className="btn-gold w-full text-lg py-3" disabled={busy}>
        {busy ? '提交中…' : submitLabel}
      </button>
    </form>
  );
}

function TeamSelect({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-white/50">{label}</label>
      <select className="input mt-1 appearance-none" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">请选择</option>
        {TEAMS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
