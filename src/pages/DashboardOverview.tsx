import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichVereinsversammlungen } from '@/lib/enrich';
import type { EnrichedVereinsversammlungen } from '@/types/enriched';
import type { Mitgliederverwaltung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { VereinsversammlungenDialog } from '@/components/dialogs/VereinsversammlungenDialog';
import { MitgliederverwaltungDialog } from '@/components/dialogs/MitgliederverwaltungDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  IconAlertCircle,
  IconPlus,
  IconPencil,
  IconTrash,
  IconUsers,
  IconCalendar,
  IconSearch,
  IconMapPin,
  IconClock,
  IconUserCheck,
  IconUserX,
  IconChevronRight,
} from '@tabler/icons-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

function fmtDateTime(s?: string) {
  if (!s) return '—';
  try { return format(parseISO(s), 'dd.MM.yyyy HH:mm', { locale: de }); } catch { return s; }
}

function statusColor(key?: string) {
  if (key === 'aktiv') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (key === 'passiv') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (key === 'ausgetreten') return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-muted text-muted-foreground border-border';
}

function beitragColor(paid?: string) {
  if (!paid) return 'bg-rose-100 text-rose-700 border-rose-200';
  const year = parseInt(paid.slice(0, 4), 10);
  const now = new Date().getFullYear();
  if (year >= now) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

export default function DashboardOverview() {
  const {
    vereinsversammlungen, mitgliederverwaltung,
    mitgliederverwaltungMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedVereinsversammlungen = enrichVereinsversammlungen(vereinsversammlungen, { mitgliederverwaltungMap });

  // --- state (ALL hooks before early returns) ---
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'alle' | 'aktiv' | 'passiv' | 'ausgetreten'>('alle');
  const [selectedMember, setSelectedMember] = useState<Mitgliederverwaltung | null>(null);

  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<Mitgliederverwaltung | null>(null);
  const [deleteMember, setDeleteMember] = useState<Mitgliederverwaltung | null>(null);

  const [versammlungDialogOpen, setVersammlungDialogOpen] = useState(false);
  const [editVersammlung, setEditVersammlung] = useState<EnrichedVereinsversammlungen | null>(null);
  const [deleteVersammlung, setDeleteVersammlung] = useState<EnrichedVereinsversammlungen | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);

  const upcomingVersammlungen = useMemo(() =>
    enrichedVereinsversammlungen
      .filter(v => v.fields.datum_uhrzeit && !isBefore(parseISO(v.fields.datum_uhrzeit), today))
      .sort((a, b) => (a.fields.datum_uhrzeit ?? '').localeCompare(b.fields.datum_uhrzeit ?? '')),
    [enrichedVereinsversammlungen, today]
  );

  const pastVersammlungen = useMemo(() =>
    enrichedVereinsversammlungen
      .filter(v => v.fields.datum_uhrzeit && isBefore(parseISO(v.fields.datum_uhrzeit), today))
      .sort((a, b) => (b.fields.datum_uhrzeit ?? '').localeCompare(a.fields.datum_uhrzeit ?? ''))
      .slice(0, 5),
    [enrichedVereinsversammlungen, today]
  );

  const filteredMembers = useMemo(() => {
    let list = mitgliederverwaltung;
    if (memberFilter !== 'alle') {
      list = list.filter(m => m.fields.mitgliedsstatus?.key === memberFilter);
    }
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      list = list.filter(m =>
        `${m.fields.vorname ?? ''} ${m.fields.nachname ?? ''}`.toLowerCase().includes(q) ||
        (m.fields.email ?? '').toLowerCase().includes(q) ||
        (m.fields.abteilung ?? '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) =>
      `${a.fields.nachname ?? ''}${a.fields.vorname ?? ''}`.localeCompare(`${b.fields.nachname ?? ''}${b.fields.vorname ?? ''}`)
    );
  }, [mitgliederverwaltung, memberFilter, memberSearch]);

  const stats = useMemo(() => {
    const aktiv = mitgliederverwaltung.filter(m => m.fields.mitgliedsstatus?.key === 'aktiv').length;
    const beitragOk = mitgliederverwaltung.filter(m => {
      const p = m.fields.jahresbeitrag_status;
      return p && parseInt(p.slice(0, 4), 10) >= new Date().getFullYear();
    }).length;
    return { total: mitgliederverwaltung.length, aktiv, beitragOk };
  }, [mitgliederverwaltung]);

  const selectedMemberVersammlungen = useMemo(() => {
    if (!selectedMember) return [];
    return enrichedVereinsversammlungen.filter(v => {
      const t = v.fields.teilnehmer;
      if (!t) return false;
      const ids = Array.isArray(t) ? t : [t];
      return ids.some((url: string) => url.includes(selectedMember.record_id));
    });
  }, [selectedMember, enrichedVereinsversammlungen]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Mitglieder gesamt"
          value={String(stats.total)}
          description="Registriert"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Aktive Mitglieder"
          value={String(stats.aktiv)}
          description="Mitgliedsstatus aktiv"
          icon={<IconUserCheck size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Beitrag bezahlt"
          value={String(stats.beitragOk)}
          description={`von ${stats.total} Mitgliedern`}
          icon={<IconUserX size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Versammlungen"
          value={String(enrichedVereinsversammlungen.length)}
          description={`${upcomingVersammlungen.length} bevorstehend`}
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Main workspace: 2-column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Member list (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-foreground shrink-0">Mitglieder</h2>
              <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[160px]">
                  <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Suchen..."
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['alle', 'aktiv', 'passiv', 'ausgetreten'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setMemberFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        memberFilter === f
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {f === 'alle' ? 'Alle' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => { setEditMember(null); setMemberDialogOpen(true); }}
              >
                <IconPlus size={14} className="shrink-0" />
                <span className="hidden sm:inline ml-1">Mitglied</span>
              </Button>
            </div>

            {/* Member list */}
            <div className="divide-y divide-border">
              {filteredMembers.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Keine Mitglieder gefunden.
                </div>
              )}
              {filteredMembers.map(m => {
                const isSelected = selectedMember?.record_id === m.record_id;
                const name = `${m.fields.vorname ?? ''} ${m.fields.nachname ?? ''}`.trim() || '—';
                const statusKey = m.fields.mitgliedsstatus?.key;
                const statusLabel = m.fields.mitgliedsstatus?.label ?? '—';
                return (
                  <div
                    key={m.record_id}
                    onClick={() => setSelectedMember(isSelected ? null : m)}
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                      statusKey === 'aktiv' ? 'bg-emerald-100 text-emerald-700' :
                      statusKey === 'passiv' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {(m.fields.vorname?.[0] ?? '') + (m.fields.nachname?.[0] ?? '')}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">{name}</span>
                        {m.fields.abteilung && (
                          <span className="text-xs text-muted-foreground truncate">{m.fields.abteilung}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {m.fields.email && (
                          <span className="text-xs text-muted-foreground truncate">{m.fields.email}</span>
                        )}
                      </div>
                    </div>

                    {/* Status + Beitrag badges */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(statusKey)}`}>
                        {statusLabel}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${beitragColor(m.fields.jahresbeitrag_status)}`}>
                        {m.fields.jahresbeitrag_status
                          ? `Beitrag ${m.fields.jahresbeitrag_status.slice(0, 4)}`
                          : 'Kein Beitrag'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setEditMember(m); setMemberDialogOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        title="Bearbeiten"
                      >
                        <IconPencil size={14} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteMember(m); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        title="Löschen"
                      >
                        <IconTrash size={14} />
                      </button>
                      <IconChevronRight size={14} className={`transition-transform text-muted-foreground ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Member detail panel */}
          {selectedMember && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                <h3 className="font-semibold text-foreground text-sm">
                  {`${selectedMember.fields.vorname ?? ''} ${selectedMember.fields.nachname ?? ''}`.trim()}
                  {' '}– Details
                </h3>
                <button onClick={() => setSelectedMember(null)} className="text-muted-foreground hover:text-foreground text-xs">
                  Schließen
                </button>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {selectedMember.fields.email && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">E-Mail</div>
                      <a href={`mailto:${selectedMember.fields.email}`} className="text-sm text-primary truncate block">
                        {selectedMember.fields.email}
                      </a>
                    </div>
                  )}
                  {selectedMember.fields.telefonnummer && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Telefon</div>
                      <a href={`tel:${selectedMember.fields.telefonnummer}`} className="text-sm text-foreground">
                        {selectedMember.fields.telefonnummer}
                      </a>
                    </div>
                  )}
                  {(selectedMember.fields.strasse || selectedMember.fields.ort) && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Adresse</div>
                      <div className="text-sm text-foreground">
                        {[
                          selectedMember.fields.strasse,
                          selectedMember.fields.hausnummer,
                        ].filter(Boolean).join(' ')}
                        {(selectedMember.fields.strasse || selectedMember.fields.hausnummer) && <br />}
                        {[
                          selectedMember.fields.postleitzahl,
                          selectedMember.fields.ort,
                        ].filter(Boolean).join(' ')}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {selectedMember.fields.abteilung && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Abteilung</div>
                      <div className="text-sm text-foreground">{selectedMember.fields.abteilung}</div>
                    </div>
                  )}
                  {selectedMember.fields.eintrittsdatum && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Eintrittsdatum</div>
                      <div className="text-sm text-foreground">{formatDate(selectedMember.fields.eintrittsdatum)}</div>
                    </div>
                  )}
                  {selectedMember.fields.geburtsdatum && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Geburtsdatum</div>
                      <div className="text-sm text-foreground">{formatDate(selectedMember.fields.geburtsdatum)}</div>
                    </div>
                  )}
                </div>
              </div>
              {selectedMemberVersammlungen.length > 0 && (
                <div className="px-5 pb-5">
                  <div className="text-xs text-muted-foreground mb-2">Versammlungen</div>
                  <div className="space-y-1.5">
                    {selectedMemberVersammlungen.slice(0, 5).map(v => (
                      <div key={v.record_id} className="flex items-center gap-2 text-sm">
                        <IconCalendar size={13} className="shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground shrink-0">{fmtDateTime(v.fields.datum_uhrzeit)}</span>
                        <span className="truncate text-foreground">{v.fields.thema ?? v.fields.ort ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Versammlungen (1/3 width) */}
        <div className="space-y-4">
          {/* Upcoming */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">Versammlungen</h2>
              <Button
                size="sm"
                onClick={() => { setEditVersammlung(null); setVersammlungDialogOpen(true); }}
              >
                <IconPlus size={14} className="shrink-0" />
                <span className="hidden sm:inline ml-1">Neu</span>
              </Button>
            </div>

            {upcomingVersammlungen.length === 0 && (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                Keine bevorstehenden Versammlungen.
              </div>
            )}

            <div className="divide-y divide-border">
              {upcomingVersammlungen.map(v => {
                const isNext = upcomingVersammlungen[0]?.record_id === v.record_id;
                return (
                  <div key={v.record_id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {isNext && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-2">
                            Nächste
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <IconClock size={12} className="shrink-0" />
                          <span>{fmtDateTime(v.fields.datum_uhrzeit)}</span>
                        </div>
                        {v.fields.thema && (
                          <div className="text-sm font-medium text-foreground line-clamp-2 mb-1">{v.fields.thema}</div>
                        )}
                        {v.fields.ort && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IconMapPin size={11} className="shrink-0" />
                            <span className="truncate">{v.fields.ort}</span>
                          </div>
                        )}
                        {v.fields.teilnehmer && (
                          <div className="mt-1.5">
                            <Badge variant="secondary" className="text-xs">
                              <IconUsers size={10} className="mr-1" />
                              {Array.isArray(v.fields.teilnehmer) ? v.fields.teilnehmer.length : 1} Teilnehmer
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => { setEditVersammlung(v); setVersammlungDialogOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="Bearbeiten"
                        >
                          <IconPencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteVersammlung(v)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          title="Löschen"
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Past versammlungen (last 5) */}
          {pastVersammlungen.length > 0 && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-muted-foreground">Vergangene Versammlungen</h3>
              </div>
              <div className="divide-y divide-border">
                {pastVersammlungen.map(v => (
                  <div key={v.record_id} className="px-5 py-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">{fmtDateTime(v.fields.datum_uhrzeit)}</div>
                      {v.fields.thema && (
                        <div className="text-sm text-foreground truncate">{v.fields.thema}</div>
                      )}
                      {v.fields.ort && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <IconMapPin size={11} className="shrink-0" />
                          <span className="truncate">{v.fields.ort}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => { setEditVersammlung(v); setVersammlungDialogOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        title="Bearbeiten"
                      >
                        <IconPencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteVersammlung(v)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        title="Löschen"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <MitgliederverwaltungDialog
        open={memberDialogOpen}
        onClose={() => { setMemberDialogOpen(false); setEditMember(null); }}
        onSubmit={async (fields) => {
          if (editMember) {
            await LivingAppsService.updateMitgliederverwaltungEntry(editMember.record_id, fields);
          } else {
            await LivingAppsService.createMitgliederverwaltungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editMember?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Mitgliederverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitgliederverwaltung']}
      />

      <VereinsversammlungenDialog
        open={versammlungDialogOpen}
        onClose={() => { setVersammlungDialogOpen(false); setEditVersammlung(null); }}
        onSubmit={async (fields) => {
          if (editVersammlung) {
            await LivingAppsService.updateVereinsversammlungenEntry(editVersammlung.record_id, fields);
          } else {
            await LivingAppsService.createVereinsversammlungenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editVersammlung?.fields}
        mitgliederverwaltungList={mitgliederverwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['Vereinsversammlungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Vereinsversammlungen']}
      />

      <ConfirmDialog
        open={!!deleteMember}
        title="Mitglied löschen"
        description={`Soll ${deleteMember?.fields.vorname ?? ''} ${deleteMember?.fields.nachname ?? ''} wirklich gelöscht werden?`}
        onConfirm={async () => {
          if (deleteMember) {
            await LivingAppsService.deleteMitgliederverwaltungEntry(deleteMember.record_id);
            if (selectedMember?.record_id === deleteMember.record_id) setSelectedMember(null);
            fetchAll();
          }
          setDeleteMember(null);
        }}
        onClose={() => setDeleteMember(null)}
      />

      <ConfirmDialog
        open={!!deleteVersammlung}
        title="Versammlung löschen"
        description={`Soll die Versammlung vom ${fmtDateTime(deleteVersammlung?.fields.datum_uhrzeit)} wirklich gelöscht werden?`}
        onConfirm={async () => {
          if (deleteVersammlung) {
            await LivingAppsService.deleteVereinsversammlungenEntry(deleteVersammlung.record_id);
            fetchAll();
          }
          setDeleteVersammlung(null);
        }}
        onClose={() => setDeleteVersammlung(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <Skeleton className="h-12 rounded-2xl" />
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 rounded-2xl" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
