import { useState, useEffect } from 'react';

export function EditableExtraction({ value, confidence, onCorrect, disabled }) {
  const [text, setText] = useState(value || '');
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    setText(value || '');
    setEdited(false);
  }, [value]);

  const handleBlur = () => {
    if (text !== (value || '') && text.trim()) {
      setEdited(true);
      onCorrect(text);
    }
  };

  const confidenceColor = {
    high: 'var(--color-emerald)',
    medium: 'var(--color-amber)',
    low: 'var(--color-rose)',
  }[confidence] || 'var(--color-steel)';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
          style={{
            background: edited ? 'var(--color-blue-light)' : 'var(--color-snow)',
            border: `1.5px solid ${edited ? 'var(--color-blue)' : 'var(--color-cloud)'}`,
            color: 'var(--color-navy)',
          }}
        />
        {edited && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--color-blue-light)', color: 'var(--color-blue)' }}
          >
            edited
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-steel)' }}>
        <span
          className="w-1.5 h-1.5 rounded-full inline-block"
          style={{ background: confidenceColor }}
        />
        {confidence} confidence
      </div>
    </div>
  );
}
