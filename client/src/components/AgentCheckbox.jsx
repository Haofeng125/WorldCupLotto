// 高哥代买开关。checked 时表示这单由高哥代买。
export default function AgentCheckbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 rounded-xl bg-black/20 border border-white/10 px-4 py-3 cursor-pointer select-none">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
          checked ? 'bg-gold-500 border-gold-400 text-pitch-900' : 'border-white/30 bg-black/30'
        }`}
      >
        {checked && '✓'}
      </span>
      <span className="flex-1 text-sm font-medium">{label || '🧧 高哥代买'}</span>
      <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
