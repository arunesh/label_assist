import { useState } from 'react';

export function OverrideControls({ field, currentStatus, onOverride, onJustify, justification, disabled }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        style={{
          color: expanded ? 'var(--color-blue)' : 'var(--color-steel)',
          background: expanded ? 'var(--color-blue-light)' : 'transparent',
          border: `1px solid ${expanded ? 'var(--color-blue)' : 'var(--color-cloud)'}`,
        }}
      >
        {expanded ? 'Close Override' : 'Override'}
      </button>

      {expanded && (
        <div
          className="mt-3 p-4 rounded-lg space-y-3"
          style={{ background: 'var(--color-snow)', border: '1px solid var(--color-cloud)' }}
        >
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-slate)' }}>
              Change status to:
            </label>
            <select
              value={currentStatus}
              onChange={(e) => onOverride(field, e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 rounded-lg text-sm cursor-pointer"
              style={{
                background: 'var(--color-white)',
                border: '1.5px solid var(--color-cloud)',
                color: 'var(--color-navy)',
              }}
            >
              <option value="pass">Pass (Match)</option>
              <option value="warning">Warning</option>
              <option value="fail">Fail (Mismatch)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-slate)' }}>
              Justification <span style={{ color: 'var(--color-rose)' }}>*</span>
            </label>
            <textarea
              value={justification || ''}
              onChange={(e) => onJustify(field, e.target.value)}
              disabled={disabled}
              placeholder="Explain your override decision..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--color-white)',
                border: '1.5px solid var(--color-cloud)',
                color: 'var(--color-navy)',
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
