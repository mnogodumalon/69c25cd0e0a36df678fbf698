import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Vereinsversammlungen, Mitgliederverwaltung, Rezepte, Zutaten, PicknickPlanung, Features, Testergebnisse, Fehlerberichte } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [vereinsversammlungen, setVereinsversammlungen] = useState<Vereinsversammlungen[]>([]);
  const [mitgliederverwaltung, setMitgliederverwaltung] = useState<Mitgliederverwaltung[]>([]);
  const [rezepte, setRezepte] = useState<Rezepte[]>([]);
  const [zutaten, setZutaten] = useState<Zutaten[]>([]);
  const [picknickPlanung, setPicknickPlanung] = useState<PicknickPlanung[]>([]);
  const [features, setFeatures] = useState<Features[]>([]);
  const [testergebnisse, setTestergebnisse] = useState<Testergebnisse[]>([]);
  const [fehlerberichte, setFehlerberichte] = useState<Fehlerberichte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [vereinsversammlungenData, mitgliederverwaltungData, rezepteData, zutatenData, picknickPlanungData, featuresData, testergebnisseData, fehlerberichteData] = await Promise.all([
        LivingAppsService.getVereinsversammlungen(),
        LivingAppsService.getMitgliederverwaltung(),
        LivingAppsService.getRezepte(),
        LivingAppsService.getZutaten(),
        LivingAppsService.getPicknickPlanung(),
        LivingAppsService.getFeatures(),
        LivingAppsService.getTestergebnisse(),
        LivingAppsService.getFehlerberichte(),
      ]);
      setVereinsversammlungen(vereinsversammlungenData);
      setMitgliederverwaltung(mitgliederverwaltungData);
      setRezepte(rezepteData);
      setZutaten(zutatenData);
      setPicknickPlanung(picknickPlanungData);
      setFeatures(featuresData);
      setTestergebnisse(testergebnisseData);
      setFehlerberichte(fehlerberichteData);
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
        const [vereinsversammlungenData, mitgliederverwaltungData, rezepteData, zutatenData, picknickPlanungData, featuresData, testergebnisseData, fehlerberichteData] = await Promise.all([
          LivingAppsService.getVereinsversammlungen(),
          LivingAppsService.getMitgliederverwaltung(),
          LivingAppsService.getRezepte(),
          LivingAppsService.getZutaten(),
          LivingAppsService.getPicknickPlanung(),
          LivingAppsService.getFeatures(),
          LivingAppsService.getTestergebnisse(),
          LivingAppsService.getFehlerberichte(),
        ]);
        setVereinsversammlungen(vereinsversammlungenData);
        setMitgliederverwaltung(mitgliederverwaltungData);
        setRezepte(rezepteData);
        setZutaten(zutatenData);
        setPicknickPlanung(picknickPlanungData);
        setFeatures(featuresData);
        setTestergebnisse(testergebnisseData);
        setFehlerberichte(fehlerberichteData);
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

  const rezepteMap = useMemo(() => {
    const m = new Map<string, Rezepte>();
    rezepte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [rezepte]);

  const zutatenMap = useMemo(() => {
    const m = new Map<string, Zutaten>();
    zutaten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [zutaten]);

  const featuresMap = useMemo(() => {
    const m = new Map<string, Features>();
    features.forEach(r => m.set(r.record_id, r));
    return m;
  }, [features]);

  return { vereinsversammlungen, setVereinsversammlungen, mitgliederverwaltung, setMitgliederverwaltung, rezepte, setRezepte, zutaten, setZutaten, picknickPlanung, setPicknickPlanung, features, setFeatures, testergebnisse, setTestergebnisse, fehlerberichte, setFehlerberichte, loading, error, fetchAll, mitgliederverwaltungMap, rezepteMap, zutatenMap, featuresMap };
}