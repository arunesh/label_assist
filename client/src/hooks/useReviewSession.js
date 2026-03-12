import { useState, useCallback } from 'react';

export function useReviewSession() {
  const [overrides, setOverrides] = useState({});
  const [corrections, setCorrections] = useState({});
  const [justifications, setJustifications] = useState({});
  const [agentNotes, setAgentNotes] = useState('');
  const [agentDecision, setAgentDecision] = useState(null);
  const [decidedAt, setDecidedAt] = useState(null);

  const setOverride = useCallback((field, status) => {
    setOverrides((prev) => ({ ...prev, [field]: status }));
  }, []);

  const setCorrection = useCallback((field, value) => {
    setCorrections((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setJustification = useCallback((field, text) => {
    setJustifications((prev) => ({ ...prev, [field]: text }));
  }, []);

  const makeDecision = useCallback((decision) => {
    setAgentDecision(decision);
    setDecidedAt(new Date().toISOString());
  }, []);

  const reset = useCallback(() => {
    setOverrides({});
    setCorrections({});
    setJustifications({});
    setAgentNotes('');
    setAgentDecision(null);
    setDecidedAt(null);
  }, []);

  const getSession = useCallback(() => ({
    agentFieldOverrides: Object.keys(overrides).reduce((acc, field) => {
      acc[field] = {
        overrideStatus: overrides[field],
        correctedExtraction: corrections[field],
        justification: justifications[field] || '',
      };
      return acc;
    }, {}),
    agentNotes,
    agentDecision,
    decidedAt,
  }), [overrides, corrections, justifications, agentNotes, agentDecision, decidedAt]);

  return {
    overrides,
    corrections,
    justifications,
    agentNotes,
    agentDecision,
    decidedAt,
    setOverride,
    setCorrection,
    setJustification,
    setAgentNotes,
    makeDecision,
    reset,
    getSession,
  };
}
