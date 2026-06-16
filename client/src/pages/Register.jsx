import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../ui.jsx';

export default function Register() {
  const { loginWith } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { token, user } = await api('/register', { method: 'POST', body: form });
      loginWith(token, user);
      toast.success('注册成功，欢迎加入！');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pitch-stripes min-h-screen flex flex-col justify-center px-6">
      <div className="fade-in mx-auto w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚽️</div>
          <h1 className="text-2xl font-extrabold">注册账号</h1>
        </div>
        <form onSubmit={submit} className="card p-6 space-y-4">
          <input className="input" placeholder="用户名" value={form.username} onChange={set('username')} />
          <input
            className="input"
            type="password"
            placeholder="密码"
            value={form.password}
            onChange={set('password')}
          />
          <input
            className="input"
            type="password"
            placeholder="确认密码"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
          />
          <input
            className="input"
            placeholder="邀请码"
            value={form.inviteCode}
            onChange={set('inviteCode')}
          />
          <button className="btn-gold w-full" disabled={busy}>
            {busy ? '注册中…' : '注 册'}
          </button>
        </form>
        <p className="text-center text-white/60 mt-5 text-sm">
          已有账号？{' '}
          <Link to="/login" className="text-gold-400 font-semibold">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
