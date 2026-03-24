import type { EnrichedVereinsversammlungen } from '@/types/enriched';
import type { Mitgliederverwaltung, Vereinsversammlungen } from '@/types/app';
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
