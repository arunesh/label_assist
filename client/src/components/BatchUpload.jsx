import { useState, useRef, useCallback } from 'react';
import { batchVerify } from '../utils/api.js';
import { BatchResultsTable } from './BatchResultsTable.jsx';
import { ErrorMessage } from './ErrorMessage.jsx';
import { exportToCSV } from '../utils/exportSession.js';

export function BatchUpload() {
  const [imageFiles, setImageFiles] = useState([]);
  const [manifest, setManifest] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const imageInputRef = useRef(null);
  const manifestInputRef = useRef(null);

  const handleImages = useCallback((files) => {
    setImageFiles(Array.from(files));
  }, []);

  const handleManifest = useCallback(async (file) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setManifest(parsed);
    } catch {
      setError('Could not parse manifest file. Please upload valid JSON.');
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!imageFiles.length || !manifest) return;
    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: imageFiles.length });

    try {
      const data = await batchVerify(imageFiles, manifest);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [imageFiles, manifest]);

  const handleReset = () => {
    setImageFiles([]);
    setManifest(null);
    setResults(null);
    setError(null);
    setProgress(null);
  };

  return (
    <div className="space-y-8">
      {/* Upload area */}
      {!results && (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-slate)' }}>
                Label Images
              </label>
              <div
                className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
                style={{ borderColor: imageFiles.length ? 'var(--color-emerald)' : 'var(--color-mist)', background: 'var(--color-white)' }}
                onClick={() => imageInputRef.current?.click()}
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImages(e.target.files)}
                />
                {imageFiles.length ? (
                  <p className="font-medium" style={{ color: 'var(--color-emerald)' }}>
                    {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} selected
                  </p>
                ) : (
                  <p style={{ color: 'var(--color-steel)' }}>Click to select label images (up to 300)</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-slate)' }}>
                Manifest (JSON)
              </label>
              <div
                className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
                style={{ borderColor: manifest ? 'var(--color-emerald)' : 'var(--color-mist)', background: 'var(--color-white)' }}
                onClick={() => manifestInputRef.current?.click()}
              >
                <input
                  ref={manifestInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleManifest(e.target.files[0])}
                />
                {manifest ? (
                  <p className="font-medium" style={{ color: 'var(--color-emerald)' }}>
                    Manifest loaded ({Object.keys(manifest).length} entries)
                  </p>
                ) : (
                  <p style={{ color: 'var(--color-steel)' }}>
                    JSON mapping filenames to application data
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!imageFiles.length || !manifest || loading}
              className="w-full py-4 rounded-xl text-base font-semibold text-white transition-all cursor-pointer"
              style={{
                background: imageFiles.length && manifest ? 'var(--color-emerald)' : 'var(--color-mist)',
                height: '56px',
                boxShadow: imageFiles.length && manifest ? '0 4px 14px rgba(5, 150, 105, 0.3)' : 'none',
              }}
            >
              {loading ? 'Processing...' : 'Process Batch'}
            </button>
          </div>

          {loading && progress && (
            <div className="rounded-xl p-5" style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-cloud)' }}>
              <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--color-slate)' }}>
                <span>Processing batch...</span>
                <span className="font-mono">{progress.total} labels</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-cloud)' }}>
                <div className="h-full rounded-full transition-all animate-pulse" style={{ background: 'var(--color-blue)', width: '60%' }} />
              </div>
            </div>
          )}
        </>
      )}

      {error && <ErrorMessage message={error} onRetry={handleReset} />}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Passed" value={results.passed} color="var(--color-emerald)" bg="var(--color-emerald-light)" />
            <StatCard label="Failed" value={results.failed} color="var(--color-rose)" bg="var(--color-rose-light)" />
            <StatCard label="Warnings" value={results.warnings} color="var(--color-amber)" bg="var(--color-amber-light)" />
          </div>

          <BatchResultsTable results={results.results} />

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                const csv = results.results.map((r) => [
                  r.filename,
                  r.result?.aiRecommendation || 'error',
                  r.error || '',
                ].join(',')).join('\n');
                const blob = new Blob([`Filename,Status,Error\n${csv}`], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'batch-results.csv'; a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-5 py-3 rounded-xl text-sm font-medium cursor-pointer"
              style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-cloud)', color: 'var(--color-slate)' }}
            >
              Export CSV
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer"
              style={{ background: 'var(--color-blue)' }}
            >
              New Batch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg }) {
  return (
    <div className="rounded-xl p-5 text-center" style={{ background: bg, border: `1.5px solid ${color}20` }}>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-sm font-medium mt-1" style={{ color }}>{label}</p>
    </div>
  );
}
