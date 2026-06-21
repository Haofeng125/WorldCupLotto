import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Modal, PageHeader, Spinner, money, useToast } from '../ui.jsx';
import BetCard from '../components/BetCard.jsx';
import SettleModal from '../components/SettleModal.jsx';
import EditBetModal from '../components/EditBetModal.jsx';

export default function Admin() {
  const [tab, setTab] = useState('users');
  return (
    <div className="min-h-screen pb-10">
      <PageHeader title="管理后台" />
      <div className="px-5 pt-4">
        <div className="flex gap-2 mb-4">
          <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>
            用户管理
          </TabBtn>
          <TabBtn active={tab === 'bets'} onClick={() => setTab('bets')}>
            投注管理
          </TabBtn>
        </div>
        {tab === 'users' ? <UsersTab /> : <BetsTab />}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`chip flex-1 text-center py-2 ${
        active ? 'bg-gold-500 text-pitch-900 border-gold-400' : 'bg-white/5 text-white/80 border-white/15'
      }`}
    >
      {children}
    </button>
  );
}

/* ----------------------------- 用户管理 ----------------------------- */
function UsersTab() {
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  async function load() {
    try {
      const { users } = await api('/admin/users');
      setUsers(users);
    } catch (err) {
      toast.error(err.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function confirmDelete() {
    try {
      await api(`/admin/users/${deleting.id}`, { method: 'DELETE' });
      toast.success('已删除用户');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!users) return <Spinner />;
  return (
    <div className="space-y-3 fade-in">
      {users.map((u) => (
        <div key={u.id} className="card p-4 flex items-center justify-between">
          <div>
            <p className="font-bold flex items-center gap-2">
              {u.username}
              {u.is_admin && (
                <span className="rounded-full bg-gold-500 text-pitch-900 text-xs px-2 py-0.5">管理员</span>
              )}
            </p>
            <p className="text-white/50 text-sm">实力 {money(u.skill_score)} · 真实 {money(u.real_score)}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost py-1.5 px-3 text-sm" onClick={() => setEditing(u)}>
              编辑
            </button>
            {!u.is_admin && (
              <button className="btn-danger py-1.5 px-3 text-sm" onClick={() => setDeleting(u)}>
                删除
              </button>
            )}
          </div>
        </div>
      ))}

      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} />}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="确认删除用户"
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
        <p className="text-white/70">确定删除用户「{deleting?.username}」吗？该用户的所有投注也会一并删除。</p>
      </Modal>
    </div>
  );
}

function EditUserModal({ user, onClose, onDone }) {
  const toast = useToast();
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api(`/admin/users/${user.id}`, {
        method: 'PUT',
        body: { username, password: password || undefined },
      });
      toast.success('已保存');
      onDone();
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
      title={`编辑：${user.username}`}
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
        <div>
          <label className="text-xs text-white/50">用户名</label>
          <input className="input mt-1" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-white/50">新密码（留空则不修改）</label>
          <input
            className="input mt-1"
            type="password"
            placeholder="不修改请留空"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

/* ----------------------------- 投注管理 ----------------------------- */
function BetsTab() {
  const toast = useToast();
  const [bets, setBets] = useState(null);
  const [settling, setSettling] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  async function load() {
    try {
      const { bets } = await api('/bets?all=1');
      setBets(bets);
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

  if (!bets) return <Spinner />;
  if (bets.length === 0) return <div className="card p-8 text-center text-white/50">还没有任何投注</div>;
  return (
    <div className="space-y-3 fade-in">
      {bets.map((bet) => (
        <BetCard key={bet.id} bet={bet} showUser onSettle={setSettling} onEdit={setEditing} onDelete={setDeleting} />
      ))}

      {settling && (
        <SettleModal bet={settling} onClose={() => setSettling(null)} onDone={() => { setSettling(null); load(); }} />
      )}
      {editing && (
        <EditBetModal bet={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} />
      )}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="确认删除投注"
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
        <p className="text-white/70">确定删除「{deleting?.username}」的这张投注吗？</p>
      </Modal>
    </div>
  );
}
