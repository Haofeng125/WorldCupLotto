import { createContext, useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ------------------------- 子页面顶部栏 --------------------------- */
export function PageHeader({ title, right }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-pitch-900/80 backdrop-blur px-4 py-3 border-b border-white/10">
      <button
        onClick={() => navigate('/')}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg active:scale-95"
        aria-label="返回大厅"
      >
        ‹
      </button>
      <h1 className="flex-1 text-lg font-bold">{title}</h1>
      {right}
    </header>
  );
}

/* --------------------------- Toast 通知 --------------------------- */
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  const toast = {
    info: (m) => push(m, 'info'),
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
  };
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`fade-in pointer-events-auto rounded-xl px-4 py-2.5 text-sm font-medium shadow-card backdrop-blur
              ${
                t.type === 'success'
                  ? 'bg-pitch-500/95 text-white'
                  : t.type === 'error'
                  ? 'bg-red-500/95 text-white'
                  : 'bg-black/80 text-white'
              }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ----------------------------- Modal ------------------------------ */
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="fade-in relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0b2c1a] shadow-card max-h-[88vh] overflow-y-auto">
        {title && (
          <h3 className="sticky top-0 z-10 bg-[#0b2c1a] border-b border-white/10 px-5 py-4 text-lg font-bold text-gold-400">
            {title}
          </h3>
        )}
        <div className="p-5">
          {children}
          {footer && <div className="mt-5 flex gap-3">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Spinner ------------------------------ */
export function Spinner({ label = '加载中…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-white/60">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-gold-400" />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}

/* ----------------------- helpers / 格式化 ------------------------- */
export function money(n) {
  return `${Number(n).toFixed(2)} 元`;
}

const STATUS_MAP = {
  pending: { label: '未结算', cls: 'bg-white/15 text-white' },
  won: { label: '已中奖', cls: 'bg-gold-500 text-pitch-900' },
  lost: { label: '未中奖', cls: 'bg-red-500/80 text-white' },
};
export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>;
}
