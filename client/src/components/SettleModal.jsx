import { useState } from 'react';
import { api } from '../api.js';
import { Modal, useToast } from '../ui.jsx';

export default function SettleModal({ bet, onClose, onDone }) {
  const toast = useToast();
  const [status, setStatus] = useState(bet?.status || 'pending');
  const [payout, setPayout] = useState(bet?.payout ? String(bet.payout) : '');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api(`/bets/${bet.id}/settle`, {
        method: 'POST',
        body: { status, payout: Number(payout) || 0 },
      });
      toast.success('已结算');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const OPTIONS = [
    { v: 'pending', label: '未结算' },
    { v: 'won', label: '已中奖' },
    { v: 'lost', label: '未中奖' },
  ];

  return (
    <Modal
      open={!!bet}
      onClose={onClose}
      title="结算投注"
      footer={
        <>
          <button className="btn-ghost flex-1" onClick={onClose}>
            取消
          </button>
          <button className="btn-gold flex-1" onClick={save} disabled={busy}>
            {busy ? '保存中…' : '保存'}
          </button>
        </>
      }
    >
      <div className="flex gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.v}
            onClick={() => setStatus(o.v)}
            className={`chip flex-1 text-center ${
              status === o.v
                ? 'bg-gold-500 text-pitch-900 border-gold-400'
                : 'bg-white/5 text-white/80 border-white/15'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {status === 'won' && (
        <div className="mt-4">
          <label className="text-xs text-white/50">中奖金额（元）</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            className="input mt-1"
            placeholder="实际到账奖金"
            value={payout}
            onChange={(e) => setPayout(e.target.value)}
          />
          <p className="mt-2 text-xs text-white/40">提示：填写实际中奖金额，将计入你的现金余额。</p>
        </div>
      )}
    </Modal>
  );
}
