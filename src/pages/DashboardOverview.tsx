import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichVereinsversammlungen } from '@/lib/enrich';
import type { EnrichedVereinsversammlungen } from '@/types/enriched';
import type { Mitgliederverwaltung, Vereinsversammlungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MitgliederverwaltungDialog } from '@/components/dialogs/MitgliederverwaltungDialog';
import { VereinsversammlungenDialog } from '@/components/dialogs/VereinsversammlungenDialog';
import {
  IconAlertCircle, IconPlus, IconPencil, IconTrash, IconUsers,
  IconUserCheck, IconUserOff, IconCalendarEvent, IconSearch, IconX,
  IconMapPin, IconClock, IconChevronDown, IconChevronUp
} from '@tabler/icons-react';

// ─── Status helpers ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; badgeClass: string }> = {
  aktiv:       { label: 'Aktiv',      color: 'text-emerald-700', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  passiv:      { label: 'Passiv',     color: 'text-amber-700',   badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  ausgetreten: { label: 'Ausgetreten', color: 'text-rose-700',   badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' },
};

function getMemberInitials(m: Mitgliederverwaltung) {
  const v = (m.fields.vorname ?? '').charAt(0).toUpperCase();
  const n = (m.fields.nachname ?? '').charAt(0).toUpperCase();
  return (v + n) || '?';
}

function getMemberName(m: Mitgliederverwaltung) {
  return [m.fields.vorname, m.fields.nachname].filter(Boolean).join(' ') || '—';
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const {
    mitgliederverwaltung, vereinsversammlungen,
    mitgliederverwaltungMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedVereinsversammlungen: EnrichedVereinsversammlungen[] = enrichVereinsversammlungen(vereinsversammlungen, { mitgliederverwaltungMap });

  // ── State (ALL hooks before early returns) ──────────────────────────────
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(['ausgetreten']));
  const [memberDialog, setMemberDialog] = useState<{ open: boolean; record?: Mitgliederverwaltung }>({ open: false });
  const [assemblyDialog, setAssemblyDialog] = useState<{ open: boolean; record?: Vereinsversammlungen }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'member' | 'assembly'; id: string } | null>(null);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return mitgliederverwaltung;
    return mitgliederverwaltung.filter(m =>
      getMemberName(m).toLowerCase().includes(q) ||
      (m.fields.email ?? '').toLowerCase().includes(q) ||
      (m.fields.abteilung ?? '').toLowerCase().includes(q)
    );
  }, [mitgliederverwaltung, search]);

  const membersByStatus = useMemo(() => {
    const groups: Record<string, Mitgliederverwaltung[]> = { aktiv: [], passiv: [], ausgetreten: [] };
    filteredMembers.forEach(m => {
      const key = m.fields.mitgliedsstatus?.key ?? 'aktiv';
      if (groups[key]) groups[key].push(m);
      else groups['aktiv'].push(m);
    });
    return groups;
  }, [filteredMembers]);

  const upcomingAssemblies = useMemo(() => {
    const now = new Date();
    return enrichedVereinsversammlungen
      .filter(a => a.fields.datum_uhrzeit && new Date(a.fields.datum_uhrzeit) >= now)
      .sort((a, b) => (a.fields.datum_uhrzeit ?? '').localeCompare(b.fields.datum_uhrzeit ?? ''));
  }, [enrichedVereinsversammlungen]);

  const pastAssemblies = useMemo(() => {
    const now = new Date();
    return enrichedVereinsversammlungen
      .filter(a => !a.fields.datum_uhrzeit || new Date(a.fields.datum_uhrzeit) < now)
      .sort((a, b) => (b.fields.datum_uhrzeit ?? '').localeCompare(a.fields.datum_uhrzeit ?? ''));
  }, [enrichedVereinsversammlungen]);

  const statsAktiv   = mitgliederverwaltung.filter(m => m.fields.mitgliedsstatus?.key === 'aktiv').length;
  const statsPassiv  = mitgliederverwaltung.filter(m => m.fields.mitgliedsstatus?.key === 'passiv').length;
  const statsTotal   = mitgliederverwaltung.length;

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'member') {
      await LivingAppsService.deleteMitgliederverwaltungEntry(deleteTarget.id);
    } else {
      await LivingAppsService.deleteVereinsversammlungenEntry(deleteTarget.id);
    }
    setDeleteTarget(null);
    fetchAll();
  }

  function toggleGroup(key: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Early returns ───────────────────────────────────────────────────────
  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Mitglieder gesamt"
          value={String(statsTotal)}
          description="im Verein"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Aktive Mitglieder"
          value={String(statsAktiv)}
          description="Beitragszahler"
          icon={<IconUserCheck size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Passive Mitglieder"
          value={String(statsPassiv)}
          description="beitragsfrei"
          icon={<IconUserOff size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Versammlungen"
          value={String(vereinsversammlungen.length)}
          description={`${upcomingAssemblies.length} bevorstehend`}
          icon={<IconCalendarEvent size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Member Directory (2/3 width) ─────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground">Mitgliederverzeichnis</h2>
              <p className="text-sm text-muted-foreground">
                {filteredMembers.length} von {statsTotal} Mitgliedern
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setMemberDialog({ open: true })}
              className="shrink-0"
            >
              <IconPlus size={15} className="mr-1.5 shrink-0" />
              <span className="hidden sm:inline">Mitglied hinzufügen</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Name, E-Mail oder Abteilung suchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <IconX size={14} />
              </button>
            )}
          </div>

          {/* Member groups */}
          {(['aktiv', 'passiv', 'ausgetreten'] as const).map(status => {
            const members = membersByStatus[status];
            const cfg = STATUS_CONFIG[status];
            const isCollapsed = collapsedGroups.has(status);

            return (
              <div key={status} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(status)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                  <Badge variant="outline" className={`text-xs border ${cfg.badgeClass}`}>
                    {members.length}
                  </Badge>
                  <span className="ml-auto text-muted-foreground">
                    {isCollapsed ? <IconChevronDown size={15} /> : <IconChevronUp size={15} />}
                  </span>
                </button>

                {/* Member list */}
                {!isCollapsed && (
                  <div className="border-t border-border divide-y divide-border">
                    {members.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        {search ? 'Keine Treffer' : 'Keine Mitglieder in dieser Gruppe'}
                      </div>
                    ) : (
                      members.map(m => (
                        <MemberRow
                          key={m.record_id}
                          member={m}
                          onEdit={() => setMemberDialog({ open: true, record: m })}
                          onDelete={() => setDeleteTarget({ type: 'member', id: m.record_id })}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredMembers.length === 0 && mitgliederverwaltung.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <IconUsers size={40} className="mx-auto text-muted-foreground mb-3" stroke={1.5} />
              <p className="font-medium text-foreground mb-1">Noch keine Mitglieder</p>
              <p className="text-sm text-muted-foreground mb-4">Fügen Sie das erste Mitglied hinzu.</p>
              <Button size="sm" onClick={() => setMemberDialog({ open: true })}>
                <IconPlus size={14} className="mr-1.5" />
                Mitglied hinzufügen
              </Button>
            </div>
          )}
        </div>

        {/* ── Assemblies sidebar (1/3 width) ───────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Versammlungen</h2>
              <p className="text-sm text-muted-foreground">{vereinsversammlungen.length} gesamt</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAssemblyDialog({ open: true })}
              className="shrink-0"
            >
              <IconPlus size={14} className="mr-1" />
              Neu
            </Button>
          </div>

          {/* Upcoming */}
          {upcomingAssemblies.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-primary/5">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Bevorstehend</span>
              </div>
              <div className="divide-y divide-border">
                {upcomingAssemblies.map(a => (
                  <AssemblyRow
                    key={a.record_id}
                    assembly={a}
                    highlight
                    onEdit={() => setAssemblyDialog({ open: true, record: a })}
                    onDelete={() => setDeleteTarget({ type: 'assembly', id: a.record_id })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past assemblies */}
          {pastAssemblies.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vergangen</span>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {pastAssemblies.map(a => (
                  <AssemblyRow
                    key={a.record_id}
                    assembly={a}
                    highlight={false}
                    onEdit={() => setAssemblyDialog({ open: true, record: a })}
                    onDelete={() => setDeleteTarget({ type: 'assembly', id: a.record_id })}
                  />
                ))}
              </div>
            </div>
          )}

          {vereinsversammlungen.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
              <IconCalendarEvent size={36} className="mx-auto text-muted-foreground mb-2" stroke={1.5} />
              <p className="text-sm font-medium text-foreground mb-1">Keine Versammlungen</p>
              <p className="text-xs text-muted-foreground mb-3">Planen Sie die nächste Versammlung.</p>
              <Button size="sm" variant="outline" onClick={() => setAssemblyDialog({ open: true })}>
                <IconPlus size={13} className="mr-1" />
                Versammlung anlegen
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}
      <MitgliederverwaltungDialog
        open={memberDialog.open}
        onClose={() => setMemberDialog({ open: false })}
        onSubmit={async (fields) => {
          if (memberDialog.record) {
            await LivingAppsService.updateMitgliederverwaltungEntry(memberDialog.record.record_id, fields);
          } else {
            await LivingAppsService.createMitgliederverwaltungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={memberDialog.record?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Mitgliederverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitgliederverwaltung']}
      />

      <VereinsversammlungenDialog
        open={assemblyDialog.open}
        onClose={() => setAssemblyDialog({ open: false })}
        onSubmit={async (fields) => {
          if (assemblyDialog.record) {
            await LivingAppsService.updateVereinsversammlungenEntry(assemblyDialog.record.record_id, fields);
          } else {
            await LivingAppsService.createVereinsversammlungenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={assemblyDialog.record?.fields}
        mitgliederverwaltungList={mitgliederverwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['Vereinsversammlungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Vereinsversammlungen']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'member' ? 'Mitglied löschen' : 'Versammlung löschen'}
        description={
          deleteTarget?.type === 'member'
            ? 'Möchten Sie dieses Mitglied wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
            : 'Möchten Sie diese Versammlung wirklich löschen?'
        }
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Member Row ────────────────────────────────────────────────────────────

function MemberRow({
  member,
  onEdit,
  onDelete,
}: {
  member: Mitgliederverwaltung;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
        {getMemberInitials(member)}
      </div>

      {/* Name + details */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground truncate">{getMemberName(member)}</div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {member.fields.email && (
            <span className="text-xs text-muted-foreground truncate max-w-[160px]">{member.fields.email}</span>
          )}
          {member.fields.abteilung && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">{member.fields.abteilung}</Badge>
          )}
          {member.fields.eintrittsdatum && (
            <span className="text-xs text-muted-foreground shrink-0">seit {formatDate(member.fields.eintrittsdatum)}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Bearbeiten"
        >
          <IconPencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Löschen"
        >
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Assembly Row ──────────────────────────────────────────────────────────

function AssemblyRow({
  assembly,
  highlight,
  onEdit,
  onDelete,
}: {
  assembly: EnrichedVereinsversammlungen;
  highlight: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dateStr = assembly.fields.datum_uhrzeit;
  let displayDate = '—';
  let displayTime = '';
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      displayDate = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      displayTime = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      displayDate = dateStr;
    }
  }

  return (
    <div className={`px-4 py-3 hover:bg-accent/30 transition-colors ${highlight ? 'bg-primary/5' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {/* Date + time */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>
              {displayDate}
            </span>
            {displayTime && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <IconClock size={11} className="shrink-0" />
                {displayTime} Uhr
              </span>
            )}
          </div>

          {/* Topic */}
          {assembly.fields.thema && (
            <p className="text-xs text-foreground line-clamp-2 mb-1">{assembly.fields.thema}</p>
          )}

          {/* Location */}
          {assembly.fields.ort && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconMapPin size={11} className="shrink-0" />
              <span className="truncate">{assembly.fields.ort}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onEdit}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Bearbeiten"
          >
            <IconPencil size={12} />
          </button>
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Löschen"
          >
            <IconTrash size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Loading / Error ───────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 rounded-xl" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-8 w-36" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
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
