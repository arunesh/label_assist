import { StatusBadge } from './StatusBadge.jsx';
import { EditableExtraction } from './EditableExtraction.jsx';
import { OverrideControls } from './OverrideControls.jsx';
import { FIELD_LABELS } from '../utils/constants.js';

export function FieldReviewRow({
  fieldResult,
  extractedField,
  override,
  correction,
  justification,
  onCorrect,
  onOverride,
  onJustify,
  disabled,
}) {
  const { field, status, applicationValue, note } = fieldResult;
  const displayStatus = override || status;
  const isOverridden = override && override !== status;

  return (
    <div
      className="p-5 rounded-xl transition-all duration-200"
      style={{
        background: 'var(--color-white)',
        border: `1.5px solid ${displayStatus === 'fail' ? '#fca5a5' : displayStatus === 'warning' ? '#fcd34d' : 'var(--color-cloud)'}`,
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Field label + status */}
        <div className="lg:w-44 shrink-0">
          <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-navy)' }}>
            {FIELD_LABELS[field] || field}
          </h4>
          <StatusBadge status={displayStatus} overridden={isOverridden} />
          {isOverridden && (
            <div className="mt-1">
              <span className="text-xs line-through" style={{ color: 'var(--color-steel)' }}>
                AI: {status}
              </span>
            </div>
          )}
        </div>

        {/* Application value */}
        <div className="lg:flex-1">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-steel)' }}>Application Data</p>
          <p className="text-sm font-mono px-3 py-2 rounded-lg" style={{ background: 'var(--color-snow)', color: 'var(--color-navy)' }}>
            {applicationValue || '—'}
          </p>
        </div>

        {/* Extracted value (editable) */}
        <div className="lg:flex-1">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-steel)' }}>Label (editable)</p>
          <EditableExtraction
            value={correction || extractedField?.value}
            confidence={extractedField?.confidence}
            onCorrect={(val) => onCorrect(field, val)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Note */}
      <p className="text-xs mt-3" style={{ color: 'var(--color-steel)' }}>{note}</p>

      {/* Override controls */}
      <div className="mt-3">
        <OverrideControls
          field={field}
          currentStatus={displayStatus}
          onOverride={onOverride}
          onJustify={onJustify}
          justification={justification}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
