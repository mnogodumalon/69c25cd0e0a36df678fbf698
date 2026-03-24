import type { EnrichedFehlerberichte, EnrichedPicknickPlanung, EnrichedRezepte, EnrichedTestergebnisse, EnrichedVereinsversammlungen } from '@/types/enriched';
import type { Features, Fehlerberichte, Mitgliederverwaltung, PicknickPlanung, Rezepte, Testergebnisse, Vereinsversammlungen, Zutaten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface VereinsversammlungenMaps {
  mitgliederverwaltungMap: Map<string, Mitgliederverwaltung>;
}

export function enrichVereinsversammlungen(
  vereinsversammlungen: Vereinsversammlungen[],
  maps: VereinsversammlungenMaps
): EnrichedVereinsversammlungen[] {
  return vereinsversammlungen.map(r => ({
    ...r,
    teilnehmerName: resolveDisplay(r.fields.teilnehmer, maps.mitgliederverwaltungMap, 'vorname', 'nachname'),
  }));
}

interface RezepteMaps {
  zutatenMap: Map<string, Zutaten>;
}

export function enrichRezepte(
  rezepte: Rezepte[],
  maps: RezepteMaps
): EnrichedRezepte[] {
  return rezepte.map(r => ({
    ...r,
    zutaten_auswahlName: resolveDisplay(r.fields.zutaten_auswahl, maps.zutatenMap, 'zutaten_name'),
  }));
}

interface PicknickPlanungMaps {
  rezepteMap: Map<string, Rezepte>;
}

export function enrichPicknickPlanung(
  picknickPlanung: PicknickPlanung[],
  maps: PicknickPlanungMaps
): EnrichedPicknickPlanung[] {
  return picknickPlanung.map(r => ({
    ...r,
    rezepte_auswahlName: resolveDisplay(r.fields.rezepte_auswahl, maps.rezepteMap, 'rezept_name'),
  }));
}

interface TestergebnisseMaps {
  featuresMap: Map<string, Features>;
}

export function enrichTestergebnisse(
  testergebnisse: Testergebnisse[],
  maps: TestergebnisseMaps
): EnrichedTestergebnisse[] {
  return testergebnisse.map(r => ({
    ...r,
    feature_refName: resolveDisplay(r.fields.feature_ref, maps.featuresMap, 'feature_name'),
  }));
}

interface FehlerberichteMaps {
  featuresMap: Map<string, Features>;
}

export function enrichFehlerberichte(
  fehlerberichte: Fehlerberichte[],
  maps: FehlerberichteMaps
): EnrichedFehlerberichte[] {
  return fehlerberichte.map(r => ({
    ...r,
    fehler_feature_refName: resolveDisplay(r.fields.fehler_feature_ref, maps.featuresMap, 'feature_name'),
  }));
}
