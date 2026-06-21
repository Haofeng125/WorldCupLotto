import { useState } from 'react';
import AgentCheckbox from './AgentCheckbox.jsx';

// 简易投注：只选比赛日 + 填今天投了多少钱，不录入具体玩法。
export default function SimpleBetForm({ initial, submitLabel, onSubmit, busy }) {
  const [betDate, setBetDate] = useState(initial?.bet_date || '');
  const [stake, setStake] = useState(initial?.stake ? String(initial.stake) : '');
  const [note, setNote] = useState(initial?.note || '');
  const [agentBuy, setAgentBuy] = useState(!!initial?.agent_buy);

  function submit(e) {
    e.preventDefault();
    onSubmit({ simple: true, bet_date: betDate, stake: Number(stake), note, agent_buy: agentBuy, legs: [] });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="card p-4 space-y-3">
        <div>
          <label className="text-xs text-white/50">比赛日</label>
          <input type="date" className="input mt-1" value={betDate} onChange={(e) => setBetDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-white/50">今天投了多少钱（本金，元）</label>
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
            placeholder="比如买了哪几场"
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
