import { API_BASE } from './constants.js';

export async function verifyLabel(imageFile, applicationData) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('application', JSON.stringify(applicationData));

  const res = await fetch(`${API_BASE}/verify`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function recompareField(field, applicationValue, correctedExtraction) {
  const res = await fetch(`${API_BASE}/recompare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, applicationValue, correctedExtraction }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function batchVerify(imageFiles, manifest) {
  const formData = new FormData();
  imageFiles.forEach((file) => formData.append('images', file));
  formData.append('manifest', JSON.stringify(manifest));

  const res = await fetch(`${API_BASE}/batch`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  return res.json();
}
