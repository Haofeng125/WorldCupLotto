import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { PageHeader, useToast } from '../ui.jsx';
import BetForm from '../components/BetForm.jsx';
import SimpleBetForm from '../components/SimpleBetForm.jsx';

export default function AddBet() {
  const toast = useToast();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('detail'); // detail | simple

  async function submit(payload) {
    setBusy(true);
    try {
      await api('/bets', { method: 'POST', body: payload });
      await refresh();
      toast.success('投注已添加！');
      navigate('/me');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-10">
      <PageHeader title="添加投注" />
      <div className="px-5 pt-4 fade-in">
        {/* 模式切换 tab */}
        <div className="flex gap-2 mb-4 rounded-2xl bg-black/25 p-1.5">
          <TabBtn active={tab === 'detail'} onClick={() => setTab('detail')}>
            📝 详细录入
          </TabBtn>
          <TabBtn active={tab === 'simple'} onClick={() => setTab('simple')}>
            ⚡ 简易记账
          </TabBtn>
        </div>

        {tab === 'detail' ? (
          <BetForm submitLabel="确认投注" onSubmit={submit} busy={busy} />
        ) : (
          <>
            <p className="text-white/50 text-sm mb-3">
              懒得一场场选？这里只填比赛日和今天投了多少钱即可。
            </p>
            <SimpleBetForm submitLabel="确认投注" onSubmit={submit} busy={busy} />
          </>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition active:scale-95 ${
        active ? 'bg-gradient-to-b from-gold-400 to-gold-500 text-pitch-900 shadow-card' : 'text-white/70'
      }`}
    >
      {children}
    </button>
  );
}
