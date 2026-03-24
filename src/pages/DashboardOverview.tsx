import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Mitgliederverwaltung } from '@/types/app';
import { LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { MitgliederverwaltungDialog } from '@/components/dialogs/MitgliederverwaltungDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  IconAlertCircle,
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconUsers,
  IconUserCheck,
  IconUserOff,
  IconMail,
  IconPhone,
  IconCalendar,
  IconBuilding,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  aktiv: { label: 'Aktiv', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  passiv: { label: 'Passiv', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  ausgetreten: { label: 'Ausgetreten', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
};

export default function DashboardOverview() {
  const { mitgliederverwaltung, loading, error, fetchAll } = useDashboardData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [abteilungFilter, setAbteilungFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Mitgliederverwaltung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mitgliederverwaltung | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const abteilungen = useMemo(() => {
    const set = new Set<string>();
    mitgliederverwaltung.forEach(m => { if (m.fields.abteilung) set.add(m.fields.abteilung); });
    return Array.from(set).sort();
  }, [mitgliederverwaltung]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return mitgliederverwaltung.filter(m => {
      const matchSearch = !q || [
        m.fields.vorname, m.fields.nachname, m.fields.email,
        m.fields.telefonnummer, m.fields.ort, m.fields.abteilung,
      ].some(v => v?.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'all' || m.fields.mitgliedsstatus?.key === statusFilter;
      const matchAbteilung = abteilungFilter === 'all' || m.fields.abteilung === abteilungFilter;
      return matchSearch && matchStatus && matchAbteilung;
    });
  }, [mitgliederverwaltung, search, statusFilter, abteilungFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Mitgliederverwaltung[]> = { aktiv: [], passiv: [], ausgetreten: [] };
    filtered.forEach(m => {
      const key = m.fields.mitgliedsstatus?.key ?? 'aktiv';
      if (groups[key]) groups[key].push(m);
      else groups['aktiv'].push(m);
    });
    return groups;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = mitgliederverwaltung.length;
    const aktiv = mitgliederverwaltung.filter(m => m.fields.mitgliedsstatus?.key === 'aktiv').length;
    const passiv = mitgliederverwaltung.filter(m => m.fields.mitgliedsstatus?.key === 'passiv').length;
    const ausgetreten = mitgliederverwaltung.filter(m => m.fields.mitgliedsstatus?.key === 'ausgetreten').length;
    return { total, aktiv, passiv, ausgetreten };
  }, [mitgliederverwaltung]);

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCreate = async (fields: Mitgliederverwaltung['fields']) => {
    await LivingAppsService.createMitgliederverwaltungEntry(fields);
    fetchAll();
  };

  const handleEdit = async (fields: Mitgliederverwaltung['fields']) => {
    if (!editRecord) return;
    await LivingAppsService.updateMitgliederverwaltungEntry(editRecord.record_id, fields);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteMitgliederverwaltungEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const statusOptions = LOOKUP_OPTIONS.mitgliederverwaltung?.mitgliedsstatus ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mitglieder</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{stats.total} Mitglieder gesamt</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="shrink-0">
          <IconPlus size={16} className="mr-1.5 shrink-0" />
          Mitglied hinzufügen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Gesamt"
          value={String(stats.total)}
          description="Alle Mitglieder"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Aktiv"
          value={String(stats.aktiv)}
          description="Aktive Mitglieder"
          icon={<IconUserCheck size={18} className="text-emerald-600" />}
        />
        <StatCard
          title="Passiv"
          value={String(stats.passiv)}
          description="Passive Mitglieder"
          icon={<IconUserOff size={18} className="text-amber-600" />}
        />
        <StatCard
          title="Ausgetreten"
          value={String(stats.ausgetreten)}
          description="Ehemalige Mitglieder"
          icon={<IconUserOff size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            placeholder="Name, E-Mail, Ort..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            Alle
          </button>
          {statusOptions.map(opt => {
            const cfg = STATUS_CONFIG[opt.key] ?? STATUS_CONFIG['aktiv'];
            return (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(statusFilter === opt.key ? 'all' : opt.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === opt.key ? `${cfg.bg} ${cfg.color} ${cfg.border} border` : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {abteilungen.length > 0 && (
          <select
            value={abteilungFilter}
            onChange={e => setAbteilungFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Alle Abteilungen</option>
            {abteilungen.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </div>

      {/* Member groups */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl border border-dashed border-border">
          <IconUsers size={48} stroke={1.5} className="text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Keine Mitglieder gefunden</p>
          <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setAbteilungFilter('all'); }}>
            Filter zurücksetzen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([statusKey, members]) => {
            if (members.length === 0) return null;
            const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG['aktiv'];
            const isCollapsed = collapsedSections.has(statusKey);
            return (
              <div key={statusKey} className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(statusKey)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                      {cfg.label}
                    </span>
                    <span className="text-sm text-muted-foreground">{members.length} {members.length === 1 ? 'Mitglied' : 'Mitglieder'}</span>
                  </div>
                  {isCollapsed
                    ? <IconChevronDown size={16} className="text-muted-foreground shrink-0" />
                    : <IconChevronUp size={16} className="text-muted-foreground shrink-0" />
                  }
                </button>

                {/* Member cards */}
                {!isCollapsed && (
                  <div className="divide-y divide-border">
                    {members.map(member => (
                      <MemberRow
                        key={member.record_id}
                        member={member}
                        onEdit={() => { setEditRecord(member); setDialogOpen(true); }}
                        onDelete={() => setDeleteTarget(member)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <MitgliederverwaltungDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={editRecord ? handleEdit : handleCreate}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Mitgliederverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitgliederverwaltung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Mitglied löschen"
        description={`Soll ${deleteTarget?.fields.vorname ?? ''} ${deleteTarget?.fields.nachname ?? ''} wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function MemberRow({
  member,
  onEdit,
  onDelete,
}: {
  member: Mitgliederverwaltung;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const f = member.fields;
  const fullName = [f.vorname, f.nachname].filter(Boolean).join(' ') || '(Kein Name)';
  const address = [f.strasse && f.hausnummer ? `${f.strasse} ${f.hausnummer}` : f.strasse, f.postleitzahl && f.ort ? `${f.postleitzahl} ${f.ort}` : f.ort].filter(Boolean).join(', ');

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors group">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
        {(f.vorname?.[0] ?? '?').toUpperCase()}{(f.nachname?.[0] ?? '').toUpperCase()}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground truncate">{fullName}</span>
          {f.abteilung && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <IconBuilding size={11} className="shrink-0" />
              <span className="truncate max-w-[100px]">{f.abteilung}</span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {f.email && (
            <a href={`mailto:${f.email}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={e => e.stopPropagation()}>
              <IconMail size={12} className="shrink-0" />
              <span className="truncate max-w-[160px]">{f.email}</span>
            </a>
          )}
          {f.telefonnummer && (
            <a href={`tel:${f.telefonnummer}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={e => e.stopPropagation()}>
              <IconPhone size={12} className="shrink-0" />
              <span>{f.telefonnummer}</span>
            </a>
          )}
          {address && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="truncate max-w-[180px]">{address}</span>
            </span>
          )}
        </div>
      </div>

      {/* Date info */}
      <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 text-right">
        {f.eintrittsdatum && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <IconCalendar size={12} className="shrink-0" />
            Eintritt: {formatDate(f.eintrittsdatum)}
          </span>
        )}
        {f.geburtsdatum && (
          <span className="text-xs text-muted-foreground">
            Geb.: {formatDate(f.geburtsdatum)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
          title="Bearbeiten"
        >
          <IconPencil size={15} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
          title="Löschen"
        >
          <IconTrash size={15} />
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-10 rounded-xl w-full max-w-sm" />
      <Skeleton className="h-64 rounded-2xl" />
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
