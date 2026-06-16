import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Spinner, money, useToast } from '../ui.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Lobby() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);

  async function load() {
    try {
      const { leaderboard } = await api('/leaderboard');
      setBoard(leaderboard);
    } catch (err) {
      toast.error(err.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const me = board?.find((b) => b.id === user?.id);
  const myRank = board ? board.findIndex((b) => b.id === user?.id) + 1 : 0;

  return (
    <div className="pitch-stripes min-h-screen pb-12">
      {/* 顶部：欢迎 + 导航 tab 行 */}
      <header className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm">欢迎回来</p>
            <h1 className="text-xl font-extrabold flex items-center gap-2">
              {user?.username}
              {user?.is_admin && (
                <span className="rounded-full bg-gold-500 text-pitch-900 text-[10px] px-2 py-0.5 font-bold">
                  管理员
                </span>
              )}
            </h1>
          </div>
          {me && (
            <div className="text-right">
              <p className="text-white/40 text-xs">我的总分</p>
              <p className="text-lg font-extrabold text-gold-400 leading-tight">{money(me.score)}</p>
            </div>
          )}
        </div>

        {/* 导航 tab —— 横向一排，像浏览器标签 */}
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <NavTab icon="🏆" label="排行榜" active />
          <NavTab icon="➕" label="添加投注" onClick={() => navigate('/add-bet')} />
          <NavTab icon="👤" label="我的" onClick={() => navigate('/me')} />
          {user?.is_admin && <NavTab icon="🛠️" label="管理后台" onClick={() => navigate('/admin')} />}
        </nav>
      </header>

      {/* 排行榜主体 */}
      <main className="px-5 mt-4">
        {!board ? (
          <Spinner />
        ) : (
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-gold-500/20 to-transparent px-5 py-4 border-b border-white/10">
              <h2 className="text-lg font-extrabold flex items-center gap-2">🏆 实时排行榜</h2>
              {myRank > 0 && <span className="text-xs text-white/50">我的排名 第 {myRank} 名</span>}
            </div>

            <div className="divide-y divide-white/5">
              {board.map((row, i) => {
                const isMe = row.id === user?.id;
                const top = i < 3;
                return (
                  <div
                    key={row.id}
                    className={`flex items-center gap-3 px-4 py-3.5 transition
                      ${isMe ? 'bg-gold-500/10 ring-1 ring-inset ring-gold-400/40' : ''}
                      ${i === 0 ? 'bg-gradient-to-r from-gold-500/15 to-transparent' : ''}`}
                  >
                    <div className="w-9 text-center text-xl font-black">
                      {top ? (
                        MEDALS[i]
                      ) : (
                        <span className="text-white/40 text-base">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate flex items-center gap-1.5">
                        {row.username}
                        {i === 0 && <span>👑</span>}
                        {isMe && <span className="text-gold-400 text-xs">(我)</span>}
                      </div>
                      {row.pending_stake > 0 && (
                        <div className="text-xs text-white/45">未结算本金 {money(row.pending_stake)}</div>
                      )}
                    </div>
                    <div
                      className={`text-right font-extrabold tabular-nums ${
                        i === 0 ? 'text-2xl text-gold-400' : 'text-lg text-gold-400/90'
                      }`}
                    >
                      {money(row.score)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 我的资产明细 */}
        {me && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="现金余额" value={money(me.cash)} />
            <Stat label="未结算本金" value={money(me.pending_stake)} />
          </div>
        )}
      </main>
    </div>
  );
}

function NavTab({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-95
        ${
          active
            ? 'bg-gradient-to-b from-gold-400 to-gold-500 text-pitch-900 shadow-card'
            : 'bg-white/[0.07] text-white/80 border border-white/10 hover:bg-white/15'
        }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-white/50 text-xs">{label}</p>
      <p className="font-bold text-lg">{value}</p>
    </div>
  );
}
