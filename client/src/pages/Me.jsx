import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Modal, PageHeader, Spinner, money, useToast } from '../ui.jsx';
import BetCard from '../components/BetCard.jsx';
import SettleModal from '../components/SettleModal.jsx';
import EditBetModal from '../components/EditBetModal.jsx';

export default function Me() {
  const { user, logout, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [bets, setBets] = useState(null);
  const [settling, setSettling] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showPwd, setShowPwd] = useState(false);

  async function load() {
    try {
      const { bets } = await api('/bets');
      setBets(bets);
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function confirmDelete() {
    try {
      await api(`/bets/${deleting.id}`, { method: 'DELETE' });
      toast.success('已删除');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function doLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen pb-10">
      <PageHeader title="我的" />

      <div className="px-5 pt-4 space-y-5">
        {/* 资产 */}
        {user && (
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">{user.username}</p>
                <p className="text-white/50 text-sm">总分 {money(user.score)}</p>
              </div>
              <div className="text-right text-sm text-white/70 space-y-0.5">
                <p>现金 {money(user.cash)}</p>
                <p>未结算 {money(user.pending_stake)}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => setShowPwd(true)}>
                重置密码
              </button>
              <button className="btn-danger flex-1" onClick={doLogout}>
                退出登录
              </button>
            </div>
          </div>
        )}

        {/* 历史投注 */}
        <div>
          <h2 className="text-lg font-bold mb-3">我的投注</h2>
          {!bets ? (
            <Spinner />
          ) : bets.length === 0 ? (
            <div className="card p-8 text-center text-white/50">
              还没有投注，去
              <span className="text-gold-400" onClick={() => navigate('/add-bet')}>
                {' '}
                添加投注{' '}
              </span>
              吧 ⚽️
            </div>
          ) : (
            <div className="space-y-3">
              {bets.map((bet) => (
                <BetCard
                  key={bet.id}
                  bet={bet}
                  onSettle={setSettling}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {settling && (
        <SettleModal
          bet={settling}
          onClose={() => setSettling(null)}
          onDone={() => {
            setSettling(null);
            load();
          }}
        />
      )}
      {editing && (
        <EditBetModal
          bet={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="确认删除"
        footer={
          <>
            <button className="btn-ghost flex-1" onClick={() => setDeleting(null)}>
              取消
            </button>
            <button className="btn-danger flex-1" onClick={confirmDelete}>
              删除
            </button>
          </>
        }
      >
        <p className="text-white/70">确定删除这张投注吗？删除后本金会退回你的余额。</p>
      </Modal>

      {showPwd && <PasswordModal onClose={() => setShowPwd(false)} />}
    </div>
  );
}

function PasswordModal({ onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    try {
      await api('/me/password', { method: 'POST', body: form });
      toast.success('密码已修改');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="重置密码"
      footer={
        <>
          <button className="btn-ghost flex-1" onClick={onClose}>
            取消
          </button>
          <button className="btn-gold flex-1" onClick={save} disabled={busy}>
            保存
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <input className="input" type="password" placeholder="原密码" value={form.oldPassword} onChange={set('oldPassword')} />
        <input className="input" type="password" placeholder="新密码" value={form.newPassword} onChange={set('newPassword')} />
        <input
          className="input"
          type="password"
          placeholder="确认新密码"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
        />
      </div>
    </Modal>
  );
}
