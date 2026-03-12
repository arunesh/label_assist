const STATUS_CONFIG = {
  pass: {
    bg: 'var(--color-emerald-light)',
    color: 'var(--color-emerald-dark)',
    border: '#6ee7b7',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    label: 'Match',
  },
  warning: {
    bg: 'var(--color-amber-light)',
    color: 'var(--color-amber-dark)',
    border: '#fcd34d',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    label: 'Warning',
  },
  fail: {
    bg: 'var(--color-rose-light)',
    color: 'var(--color-rose-dark)',
    border: '#fca5a5',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    label: 'Mismatch',
  },
};

export function StatusBadge({ status, overridden }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.fail;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
      style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
    >
      {config.icon}
      {config.label}
      {overridden && (
        <span className="ml-1 opacity-60" title="Agent override">(override)</span>
      )}
    </span>
  );
}
