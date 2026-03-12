import { useState, useRef, useCallback } from 'react';

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.tiff,.bmp,.heic';

export function ImageUploader({ onImageSelect, disabled }) {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onImageSelect(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  return (
    <div>
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        }`}
        style={{
          borderColor: dragActive ? 'var(--color-blue)' : preview ? 'var(--color-emerald)' : 'var(--color-mist)',
          background: dragActive ? 'var(--color-blue-light)' : preview ? 'var(--color-white)' : 'var(--color-white)',
          minHeight: '180px',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {preview ? (
          <div className="p-4 flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="Label preview"
              className="max-h-64 max-w-full rounded-lg object-contain"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
            />
            <p className="text-sm" style={{ color: 'var(--color-emerald)' }}>
              Image selected — click to change
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--color-cloud)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-steel)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="font-medium mb-1" style={{ color: 'var(--color-navy)' }}>
              Drop label image here
            </p>
            <p className="text-sm" style={{ color: 'var(--color-steel)' }}>
              or click to browse — JPG, PNG, WebP, TIFF
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
