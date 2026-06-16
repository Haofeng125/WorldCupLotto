import { useState } from 'react';
import { api } from '../api.js';
import { Modal, useToast } from '../ui.jsx';
import BetForm from './BetForm.jsx';

export default function EditBetModal({ bet, onClose, onDone }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function submit(payload) {
    setBusy(true);
    try {
      await api(`/bets/${bet.id}`, { method: 'PUT', body: payload });
      toast.success('已保存修改');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!bet} onClose={onClose} title="修改投注">
      <BetForm initial={bet} submitLabel="保存修改" onSubmit={submit} busy={busy} />
    </Modal>
  );
}
