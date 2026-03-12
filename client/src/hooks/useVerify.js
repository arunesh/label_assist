import { useState, useCallback } from 'react';
import { verifyLabel } from '../utils/api.js';

export function useVerify() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verify = useCallback(async (imageFile, applicationData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await verifyLabel(imageFile, applicationData);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setLoading(false);
    setError(null);
  }, []);

  return { result, loading, error, verify, reset };
}
