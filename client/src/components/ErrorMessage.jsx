export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="rounded-xl p-5 flex items-start gap-4" style={{ background: 'var(--color-rose-light)', border: '1px solid #fca5a5' }}>
      <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-rose)', color: 'white' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="font-medium" style={{ color: 'var(--color-rose-dark)' }}>Verification Error</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-rose)' }}>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer"
            style={{ background: 'var(--color-rose)', color: 'white' }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
