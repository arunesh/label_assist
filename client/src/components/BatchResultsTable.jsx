import { useState, useMemo } from 'react';
import { StatusBadge } from './StatusBadge.jsx';

export function BatchResultsTable({ results }) {
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('filename');
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return results;
    return results.filter((r) => {
      if (filter === 'error') return r.error;
      return r.result?.aiRecommendation === filter;
    });
  }, [results, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortField === 'filename') return a.filename.localeCompare(b.filename);
      const statusA = a.result?.aiRecommendation || 'error';
      const statusB = b.result?.aiRecommendation || 'error';
      return statusA.localeCompare(statusB);
    });
  }, [filtered, sortField]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid var(--color-cloud)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 flex-wrap" style={{ background: 'var(--color-snow)', borderBottom: '1px solid var(--color-cloud)' }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm cursor-pointer"
          style={{ background: 'var(--color-white)', border: '1px solid var(--color-cloud)', color: 'var(--color-navy)' }}
        >
          <option value="all">All ({results.length})</option>
          <option value="pass">Passed</option>
          <option value="fail">Failed</option>
          <option value="warning">Warnings</option>
          <option value="error">Errors</option>
        </select>

        <button
          onClick={() => setSortField(sortField === 'filename' ? 'status' : 'filename')}
          className="px-3 py-2 rounded-lg text-sm cursor-pointer"
          style={{ background: 'var(--color-white)', border: '1px solid var(--color-cloud)', color: 'var(--color-steel)' }}
        >
          Sort by: {sortField === 'filename' ? 'Filename' : 'Status'}
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-white)' }}>
        {sorted.map((r) => (
          <div key={r.filename}>
            <div
              className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors hover:bg-[var(--color-snow)]"
              style={{ borderBottom: '1px solid var(--color-cloud)' }}
              onClick={() => setExpanded(expanded === r.filename ? null : r.filename)}
            >
              <span className="text-sm font-mono flex-1" style={{ color: 'var(--color-navy)' }}>
                {r.filename}
              </span>
              {r.error ? (
                <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>
                  Error
                </span>
              ) : (
                <StatusBadge status={r.result?.aiRecommendation || 'fail'} />
              )}
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-steel)" strokeWidth="2"
                className={`transition-transform ${expanded === r.filename ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {expanded === r.filename && (
              <div className="px-5 py-4" style={{ background: 'var(--color-snow)', borderBottom: '1px solid var(--color-cloud)' }}>
                {r.error ? (
                  <p className="text-sm" style={{ color: 'var(--color-rose)' }}>{r.error}</p>
                ) : r.result?.fieldResults ? (
                  <div className="space-y-2">
                    {r.result.fieldResults.map((fr) => (
                      <div key={fr.field} className="flex items-center gap-3 text-sm">
                        <StatusBadge status={fr.status} />
                        <span className="font-medium" style={{ color: 'var(--color-navy)' }}>{fr.field}</span>
                        <span style={{ color: 'var(--color-steel)' }}>{fr.note}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
