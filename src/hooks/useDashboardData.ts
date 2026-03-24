import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Vereinsversammlungen, Mitgliederverwaltung, Zutaten, Rezepte, PicknickPlanung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [vereinsversammlungen, setVereinsversammlungen] = useState<Vereinsversammlungen[]>([]);
  const [mitgliederverwaltung, setMitgliederverwaltung] = useState<Mitgliederverwaltung[]>([]);
  const [zutaten, setZutaten] = useState<Zutaten[]>([]);
  const [rezepte, setRezepte] = useState<Rezepte[]>([]);
  const [picknickPlanung, setPicknickPlanung] = useState<PicknickPlanung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [vereinsversammlungenData, mitgliederverwaltungData, zutatenData, rezepteData, picknickPlanungData] = await Promise.all([
        LivingAppsService.getVereinsversammlungen(),
        LivingAppsService.getMitgliederverwaltung(),
        LivingAppsService.getZutaten(),
        LivingAppsService.getRezepte(),
        LivingAppsService.getPicknickPlanung(),
      ]);
      setVereinsversammlungen(vereinsversammlungenData);
      setMitgliederverwaltung(mitgliederverwaltungData);
      setZutaten(zutatenData);
      setRezepte(rezepteData);
      setPicknickPlanung(picknickPlanungData);
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
        const [vereinsversammlungenData, mitgliederverwaltungData, zutatenData, rezepteData, picknickPlanungData] = await Promise.all([
          LivingAppsService.getVereinsversammlungen(),
          LivingAppsService.getMitgliederverwaltung(),
          LivingAppsService.getZutaten(),
          LivingAppsService.getRezepte(),
          LivingAppsService.getPicknickPlanung(),
        ]);
        setVereinsversammlungen(vereinsversammlungenData);
        setMitgliederverwaltung(mitgliederverwaltungData);
        setZutaten(zutatenData);
        setRezepte(rezepteData);
        setPicknickPlanung(picknickPlanungData);
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

  const zutatenMap = useMemo(() => {
    const m = new Map<string, Zutaten>();
    zutaten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [zutaten]);

  const rezepteMap = useMemo(() => {
    const m = new Map<string, Rezepte>();
    rezepte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [rezepte]);

  return { vereinsversammlungen, setVereinsversammlungen, mitgliederverwaltung, setMitgliederverwaltung, zutaten, setZutaten, rezepte, setRezepte, picknickPlanung, setPicknickPlanung, loading, error, fetchAll, mitgliederverwaltungMap, zutatenMap, rezepteMap };
}