import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getStats, recordSolveSession } from '../store/alarmStore';

export function useStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getStats();
    setStats(data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const record = useCallback(async (session) => {
    const updated = await recordSolveSession(session);
    setStats(updated);
    return updated;
  }, []);

  return { stats, loading, load, record };
}
