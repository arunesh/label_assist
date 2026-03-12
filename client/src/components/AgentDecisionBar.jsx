export function AgentDecisionBar({ onDecision, decided, decision }) {
  if (decided) {
    const labels = { approve: 'Approved', reject: 'Rejected', return: 'Returned for Resubmission' };
    const colors = {
      approve: { bg: 'var(--color-emerald-light)', color: 'var(--color-emerald-dark)', border: '#6ee7b7' },
      reject: { bg: 'var(--color-rose-light)', color: 'var(--color-rose-dark)', border: '#fca5a5' },
      return: { bg: 'var(--color-amber-light)', color: 'var(--color-amber-dark)', border: '#fcd34d' },
    };
    const c = colors[decision] || colors.return;

    return (
      <div className="rounded-xl p-6 text-center" style={{ background: c.bg, border: `1.5px solid ${c.border}` }}>
        <p className="text-lg font-bold" style={{ color: c.color }}>
          Decision: {labels[decision]}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-6" style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-cloud)' }}>
      <p className="text-sm font-medium mb-4 text-center" style={{ color: 'var(--color-slate)' }}>
        Your Decision
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => onDecision('approve')}
          className="flex-1 min-w-[140px] py-4 rounded-xl text-base font-semibold text-white transition-all duration-200 cursor-pointer"
          style={{ background: 'var(--color-emerald)', height: '56px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)' }}
        >
          Approve
        </button>
        <button
          onClick={() => onDecision('reject')}
          className="flex-1 min-w-[140px] py-4 rounded-xl text-base font-semibold text-white transition-all duration-200 cursor-pointer"
          style={{ background: 'var(--color-rose)', height: '56px', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)' }}
        >
          Reject
        </button>
        <button
          onClick={() => onDecision('return')}
          className="flex-1 min-w-[140px] py-4 rounded-xl text-base font-semibold text-white transition-all duration-200 cursor-pointer"
          style={{ background: 'var(--color-amber)', height: '56px', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.25)' }}
        >
          Return
        </button>
      </div>
    </div>
  );
}
