import { useState, useCallback } from 'react';
import { ImageUploader } from './ImageUploader.jsx';
import { ApplicationForm } from './ApplicationForm.jsx';
import { ResultsPanel } from './ResultsPanel.jsx';
import { AgentDecisionBar } from './AgentDecisionBar.jsx';
import { ErrorMessage } from './ErrorMessage.jsx';
import { useVerify } from '../hooks/useVerify.js';
import { useReviewSession } from '../hooks/useReviewSession.js';
import { recompareField } from '../utils/api.js';
import { exportToCSV, exportToJSON } from '../utils/exportSession.js';

export function SingleVerify() {
  const [imageFile, setImageFile] = useState(null);
  const [phase, setPhase] = useState('input'); // input | verifying | reviewing | decided
  const { result, loading, error, verify, reset: resetVerify } = useVerify();
  const session = useReviewSession();

  const handleVerify = useCallback(async (appData) => {
    if (!imageFile) return;
    setPhase('verifying');
    try {
      await verify(imageFile, appData);
      setPhase('reviewing');
    } catch {
      setPhase('input');
    }
  }, [imageFile, verify]);

  const handleCorrect = useCallback(async (field, correctedValue) => {
    session.setCorrection(field, correctedValue);
    if (!result) return;
    const fieldResult = result.fieldResults.find((r) => r.field === field);
    if (!fieldResult) return;
    try {
      const updated = await recompareField(field, fieldResult.applicationValue, correctedValue);
      // Update the field result in place for display
      const idx = result.fieldResults.findIndex((r) => r.field === field);
      if (idx >= 0) {
        result.fieldResults[idx] = { ...result.fieldResults[idx], status: updated.status, note: updated.note };
      }
    } catch {
      // Recompare failed silently — agent can still override
    }
  }, [result, session]);

  const handleDecision = useCallback((decision) => {
    session.makeDecision(decision);
    setPhase('decided');
  }, [session]);

  const handleReset = () => {
    setImageFile(null);
    setPhase('input');
    resetVerify();
    session.reset();
  };

  const decided = phase === 'decided';
  const reviewing = phase === 'reviewing' || decided;

  return (
    <div className="space-y-8">
      {/* Step 1: Upload */}
      <section>
        <SectionHeader number="1" title="Upload Label Image" done={!!imageFile} />
        <ImageUploader
          onImageSelect={setImageFile}
          disabled={reviewing}
        />
      </section>

      {/* Step 2: Application Data */}
      <section>
        <SectionHeader number="2" title="Application Data" done={reviewing} />
        <ApplicationForm
          onSubmit={handleVerify}
          disabled={!imageFile || reviewing || loading}
        />
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-mist)', borderTopColor: 'var(--color-blue)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-steel)' }}>
              Analyzing label image...
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <ErrorMessage message={error} onRetry={handleReset} />}

      {/* Step 3: Results */}
      {result && reviewing && (
        <section>
          <SectionHeader number="3" title="Review AI Results" done={decided} />
          <ResultsPanel
            result={result}
            overrides={session.overrides}
            corrections={session.corrections}
            justifications={session.justifications}
            onCorrect={handleCorrect}
            onOverride={session.setOverride}
            onJustify={session.setJustification}
            agentNotes={session.agentNotes}
            onNotesChange={session.setAgentNotes}
            disabled={decided}
          />
        </section>
      )}

      {/* Step 4: Decision */}
      {reviewing && (
        <section>
          <SectionHeader number="4" title="Your Decision" done={decided} />
          <AgentDecisionBar
            onDecision={handleDecision}
            decided={decided}
            decision={session.agentDecision}
          />
        </section>
      )}

      {/* Post-decision actions */}
      {decided && (
        <div className="flex gap-3 flex-wrap justify-center pt-2">
          <button
            onClick={() => exportToCSV(result)}
            className="px-5 py-3 rounded-xl text-sm font-medium cursor-pointer"
            style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-cloud)', color: 'var(--color-slate)' }}
          >
            Export CSV
          </button>
          <button
            onClick={() => exportToJSON({ result, session: session.getSession() })}
            className="px-5 py-3 rounded-xl text-sm font-medium cursor-pointer"
            style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-cloud)', color: 'var(--color-slate)' }}
          >
            Export JSON
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer"
            style={{ background: 'var(--color-blue)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
          >
            Verify Another Label
          </button>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ number, title, done }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
        style={{
          background: done ? 'var(--color-emerald)' : 'var(--color-slate)',
          color: 'white',
        }}
      >
        {done ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          number
        )}
      </div>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>{title}</h3>
    </div>
  );
}
