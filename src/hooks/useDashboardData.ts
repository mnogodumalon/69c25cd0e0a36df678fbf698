import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Mitgliederverwaltung, Vereinsversammlungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [mitgliederverwaltung, setMitgliederverwaltung] = useState<Mitgliederverwaltung[]>([]);
  const [vereinsversammlungen, setVereinsversammlungen] = useState<Vereinsversammlungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [mitgliederverwaltungData, vereinsversammlungenData] = await Promise.all([
        LivingAppsService.getMitgliederverwaltung(),
        LivingAppsService.getVereinsversammlungen(),
      ]);
      setMitgliederverwaltung(mitgliederverwaltungData);
      setVereinsversammlungen(vereinsversammlungenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [mitgliederverwaltungData, vereinsversammlungenData] = await Promise.all([
          LivingAppsService.getMitgliederverwaltung(),
          LivingAppsService.getVereinsversammlungen(),
        ]);
        setMitgliederverwaltung(mitgliederverwaltungData);
        setVereinsversammlungen(vereinsversammlungenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const mitgliederverwaltungMap = useMemo(() => {
    const m = new Map<string, Mitgliederverwaltung>();
    mitgliederverwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitgliederverwaltung]);

  return { mitgliederverwaltung, setMitgliederverwaltung, vereinsversammlungen, setVereinsversammlungen, loading, error, fetchAll, mitgliederverwaltungMap };
}