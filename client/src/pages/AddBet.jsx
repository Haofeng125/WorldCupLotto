import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { PageHeader, useToast } from '../ui.jsx';
import BetForm from '../components/BetForm.jsx';

export default function AddBet() {
  const toast = useToast();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);

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
        <BetForm submitLabel="确认投注" onSubmit={submit} busy={busy} />
      </div>
    </div>
  );
}
