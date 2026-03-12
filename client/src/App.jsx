import { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { SingleVerify } from './components/SingleVerify.jsx';
import { BatchUpload } from './components/BatchUpload.jsx';

export default function App() {
  const [view, setView] = useState('single');

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: 'var(--color-snow)' }}>
        {/* Header */}
        <header
          className="sticky top-0 z-50"
          style={{
            background: 'var(--color-navy)',
            boxShadow: '0 4px 24px rgba(10, 22, 40, 0.15)',
          }}
        >
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo mark */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--color-emerald), #34d399)',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.4)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  LabelAssist
                </h1>
                <p className="text-xs" style={{ color: 'var(--color-steel)' }}>
                  TTB Label Verification Tool
                </p>
              </div>
            </div>

            {/* View toggle */}
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ background: 'var(--color-navy-light)', border: '1px solid var(--color-slate)' }}
            >
              <button
                onClick={() => setView('single')}
                className="px-5 py-2.5 text-sm font-medium transition-all cursor-pointer"
                style={{
                  background: view === 'single' ? 'var(--color-emerald)' : 'transparent',
                  color: view === 'single' ? 'white' : 'var(--color-silver)',
                }}
              >
                Single
              </button>
              <button
                onClick={() => setView('batch')}
                className="px-5 py-2.5 text-sm font-medium transition-all cursor-pointer"
                style={{
                  background: view === 'batch' ? 'var(--color-emerald)' : 'transparent',
                  color: view === 'batch' ? 'white' : 'var(--color-silver)',
                }}
              >
                Batch
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-6 py-10">
          {view === 'single' ? <SingleVerify /> : <BatchUpload />}
        </main>

        {/* Footer */}
        <footer className="py-6 text-center">
          <p className="text-xs" style={{ color: 'var(--color-steel)' }}>
            AI recommendations are advisory only. Agents make all final decisions.
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
