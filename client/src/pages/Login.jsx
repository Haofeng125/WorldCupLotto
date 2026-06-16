import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../ui.jsx';

export default function Login() {
  const { loginWith } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { token, user } = await api('/login', { method: 'POST', body: form });
      loginWith(token, user);
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
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🏆⚽️</div>
          <h1 className="text-2xl font-extrabold tracking-wide">世界杯彩票排行榜</h1>
          <p className="text-white/50 mt-1 text-sm">感谢高哥帮忙买彩票</p>
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
          <button className="btn-gold w-full" disabled={busy}>
            {busy ? '登录中…' : '登 录'}
          </button>
        </form>
        <p className="text-center text-white/60 mt-5 text-sm">
          还没有账号？{' '}
          <Link to="/register" className="text-gold-400 font-semibold">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
