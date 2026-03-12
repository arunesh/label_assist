import { FieldReviewRow } from './FieldReviewRow.jsx';

const REC_CONFIG = {
  pass: { bg: 'var(--color-emerald-light)', color: 'var(--color-emerald-dark)', border: '#6ee7b7', label: 'PASS' },
  warning: { bg: 'var(--color-amber-light)', color: 'var(--color-amber-dark)', border: '#fcd34d', label: 'WARNING' },
  fail: { bg: 'var(--color-rose-light)', color: 'var(--color-rose-dark)', border: '#fca5a5', label: 'FAIL' },
};

export function ResultsPanel({
  result,
  overrides,
  corrections,
  justifications,
  onCorrect,
  onOverride,
  onJustify,
  agentNotes,
  onNotesChange,
  disabled,
}) {
  const config = REC_CONFIG[result.aiRecommendation] || REC_CONFIG.fail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl p-5" style={{ background: config.bg, border: `1.5px solid ${config.border}` }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: config.color, opacity: 0.7 }}>
              AI Recommendation
            </p>
            <p className="text-2xl font-bold" style={{ color: config.color }}>
              {config.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono" style={{ color: config.color }}>
              {(result.processingTimeMs / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      </div>

      {/* Advisory notice */}
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'var(--color-blue-light)', border: '1px solid #93c5fd' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-sm" style={{ color: 'var(--color-slate)' }}>
          This is the AI's initial assessment. Review each field below and confirm or change the judgment before submitting your decision.
        </p>
      </div>

      {/* Field results */}
      <div className="space-y-3">
        {result.fieldResults.map((fr) => (
          <FieldReviewRow
            key={fr.field}
            fieldResult={fr}
            extractedField={result.extractedFields[fr.field]}
            override={overrides[fr.field]}
            correction={corrections[fr.field]}
            justification={justifications[fr.field]}
            onCorrect={onCorrect}
            onOverride={onOverride}
            onJustify={onJustify}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Agent notes */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-slate)' }}>
          Agent Notes (optional)
        </label>
        <textarea
          value={agentNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={disabled}
          placeholder="Add any observations or context for this verification..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg text-sm"
          style={{
            background: 'var(--color-white)',
            border: '1.5px solid var(--color-cloud)',
            color: 'var(--color-navy)',
            resize: 'vertical',
          }}
        />
      </div>
    </div>
  );
}
