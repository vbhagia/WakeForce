import { useState, useCallback, useEffect } from 'react';
import { getAlarms, saveAlarm, deleteAlarm, toggleAlarm } from '../store/alarmStore';
import { scheduleAlarm, cancelAlarm } from '../utils/notifications';

/**
 * Central hook for alarm list management.
 * Handles loading, CRUD, and notification sync in one place.
 */
export function useAlarms() {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAlarms();
    setAlarms(data.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (alarm) => {
    const updated = await saveAlarm(alarm);
    setAlarms(updated.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)));
    // Sync notifications
    if (alarm.enabled) {
      await scheduleAlarm(alarm);
    } else {
      await cancelAlarm(alarm.id);
    }
    return updated;
  }, []);

  const remove = useCallback(async (id) => {
    await cancelAlarm(id);
    const updated = await deleteAlarm(id);
    setAlarms(updated);
  }, []);

  const toggle = useCallback(async (id) => {
    const updated = await toggleAlarm(id);
    setAlarms(updated.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)));
    const alarm = updated.find(a => a.id === id);
    if (alarm?.enabled) await scheduleAlarm(alarm);
    else await cancelAlarm(id);
  }, []);

  return { alarms, loading, load, save, remove, toggle };
}
