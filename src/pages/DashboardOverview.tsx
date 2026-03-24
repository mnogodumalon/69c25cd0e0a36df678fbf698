import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichVereinsversammlungen, enrichPicknickPlanung } from '@/lib/enrich';
import type { EnrichedVereinsversammlungen, EnrichedPicknickPlanung } from '@/types/enriched';
import type { Mitgliederverwaltung, Rezepte, Zutaten } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { VereinsversammlungenDialog } from '@/components/dialogs/VereinsversammlungenDialog';
import { MitgliederverwaltungDialog } from '@/components/dialogs/MitgliederverwaltungDialog';
import { PicknickPlanungDialog } from '@/components/dialogs/PicknickPlanungDialog';
import { RezepteDialog } from '@/components/dialogs/RezepteDialog';
import {
  IconAlertCircle, IconPlus, IconPencil, IconTrash, IconUsers, IconCalendar,
  IconBasket, IconChefHat, IconMail, IconPhone, IconMapPin, IconClock,
  IconCheck, IconX, IconBuildingCommunity, IconSalad,
} from '@tabler/icons-react';

type Tab = 'versammlungen' | 'mitglieder' | 'picknick';

export default function DashboardOverview() {
  const {
    vereinsversammlungen, mitgliederverwaltung, zutaten, rezepte, picknickPlanung,
    mitgliederverwaltungMap, zutatenMap, rezepteMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedVersammlungen = enrichVereinsversammlungen(vereinsversammlungen, { mitgliederverwaltungMap });
  const enrichedPicknick = enrichPicknickPlanung(picknickPlanung, { rezepteMap });

  const [activeTab, setActiveTab] = useState<Tab>('versammlungen');
  const [selectedVersammlung, setSelectedVersammlung] = useState<EnrichedVereinsversammlungen | null>(null);
  const [selectedMitglied, setSelectedMitglied] = useState<Mitgliederverwaltung | null>(null);
  const [selectedPicknick, setSelectedPicknick] = useState<EnrichedPicknickPlanung | null>(null);
  const [selectedRezept, setSelectedRezept] = useState<Rezepte | null>(null);

  const [versammlungDialog, setVersammlungDialog] = useState<{ open: boolean; record?: EnrichedVereinsversammlungen }>({ open: false });
  const [mitgliedDialog, setMitgliedDialog] = useState<{ open: boolean; record?: Mitgliederverwaltung }>({ open: false });
  const [picknickDialog, setPicknickDialog] = useState<{ open: boolean; record?: EnrichedPicknickPlanung }>({ open: false });
  const [rezeptDialog, setRezeptDialog] = useState<{ open: boolean; record?: Rezepte }>({ open: false });

  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMitglieder = useMemo(() => {
    return mitgliederverwaltung.filter(m => {
      const matchesStatus = statusFilter === 'all' || m.fields.mitgliedsstatus?.key === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (m.fields.vorname ?? '').toLowerCase().includes(q) ||
        (m.fields.nachname ?? '').toLowerCase().includes(q) ||
        (m.fields.email ?? '').toLowerCase().includes(q) ||
        (m.fields.abteilung ?? '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [mitgliederverwaltung, statusFilter, searchQuery]);

  const sortedVersammlungen = useMemo(() => {
    return [...enrichedVersammlungen].sort((a, b) => {
      const da = a.fields.datum_uhrzeit ?? '';
      const db = b.fields.datum_uhrzeit ?? '';
      return db.localeCompare(da);
    });
  }, [enrichedVersammlungen]);

  const sortedPicknick = useMemo(() => {
    return [...enrichedPicknick].sort((a, b) => {
      const da = a.fields.datum_uhrzeit ?? '';
      const db = b.fields.datum_uhrzeit ?? '';
      return db.localeCompare(da);
    });
  }, [enrichedPicknick]);

  const aktiveCount = useMemo(() => mitgliederverwaltung.filter(m => m.fields.mitgliedsstatus?.key === 'aktiv').length, [mitgliederverwaltung]);
  const beitragOffen = useMemo(() => mitgliederverwaltung.filter(m => !m.fields.jahresbeitrag_status).length, [mitgliederverwaltung]);
  const naechsteVersammlung = useMemo(() => {
    const now = new Date().toISOString();
    return sortedVersammlungen.find(v => (v.fields.datum_uhrzeit ?? '') >= now.slice(0, 16));
  }, [sortedVersammlungen]);

  const rezepteForPicknick = useMemo(() => {
    if (!selectedPicknick) return [];
    const auswahl = selectedPicknick.fields.rezepte_auswahl;
    if (!auswahl) return [];
    const urls = Array.isArray(auswahl) ? auswahl : [auswahl];
    return urls.map(url => {
      const parts = String(url).split('/');
      const id = parts[parts.length - 1];
      return rezepteMap.get(id);
    }).filter((r): r is Rezepte => !!r);
  }, [selectedPicknick, rezepteMap]);

  const zutatenForRezept = useMemo(() => {
    if (!selectedRezept) return [];
    const auswahl = selectedRezept.fields.zutaten_auswahl;
    if (!auswahl) return [];
    const urls = Array.isArray(auswahl) ? auswahl : [auswahl];
    return urls.map(url => {
      const parts = String(url).split('/');
      const id = parts[parts.length - 1];
      return zutatenMap.get(id);
    }).filter((z): z is Zutaten => !!z);
  }, [selectedRezept, zutatenMap]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'versammlung') {
        await LivingAppsService.deleteVereinsversammlungenEntry(deleteTarget.id);
        if (selectedVersammlung?.record_id === deleteTarget.id) setSelectedVersammlung(null);
      } else if (deleteTarget.type === 'mitglied') {
        await LivingAppsService.deleteMitgliederverwaltungEntry(deleteTarget.id);
        if (selectedMitglied?.record_id === deleteTarget.id) setSelectedMitglied(null);
      } else if (deleteTarget.type === 'picknick') {
        await LivingAppsService.deletePicknickPlanungEntry(deleteTarget.id);
        if (selectedPicknick?.record_id === deleteTarget.id) { setSelectedPicknick(null); setSelectedRezept(null); }
      }
      fetchAll();
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'versammlungen', label: 'Versammlungen', icon: <IconCalendar size={16} className="shrink-0" />, count: vereinsversammlungen.length },
    { id: 'mitglieder', label: 'Mitglieder', icon: <IconUsers size={16} className="shrink-0" />, count: mitgliederverwaltung.length },
    { id: 'picknick', label: 'Picknick', icon: <IconBasket size={16} className="shrink-0" />, count: picknickPlanung.length },
  ];

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Aktive Mitglieder"
          value={String(aktiveCount)}
          description={`von ${mitgliederverwaltung.length} gesamt`}
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Beitrag offen"
          value={String(beitragOffen)}
          description="Noch nicht bezahlt"
          icon={<IconBuildingCommunity size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Versammlungen"
          value={String(vereinsversammlungen.length)}
          description={naechsteVersammlung ? `Nächste: ${formatDate(naechsteVersammlung.fields.datum_uhrzeit)}` : 'Keine geplant'}
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Picknick-Events"
          value={String(picknickPlanung.length)}
          description={`${rezepte.length} Rezepte, ${zutaten.length} Zutaten`}
          icon={<IconBasket size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedVersammlung(null); setSelectedMitglied(null); setSelectedPicknick(null); setSelectedRezept(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ===== VERSAMMLUNGEN TAB ===== */}
      {activeTab === 'versammlungen' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">Alle Versammlungen</h2>
              <Button size="sm" onClick={() => setVersammlungDialog({ open: true })}>
                <IconPlus size={16} className="shrink-0 mr-1" />
                <span className="hidden sm:inline">Neue Versammlung</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </div>
            {sortedVersammlungen.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card border border-dashed border-border rounded-2xl">
                <IconCalendar size={48} className="text-muted-foreground" stroke={1.5} />
                <div>
                  <p className="font-medium text-foreground">Keine Versammlungen</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Erstelle die erste Vereinsversammlung</p>
                </div>
                <Button size="sm" onClick={() => setVersammlungDialog({ open: true })}>
                  <IconPlus size={16} className="mr-1 shrink-0" /> Erstellen
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedVersammlungen.map(v => {
                  const isSelected = selectedVersammlung?.record_id === v.record_id;
                  const now = new Date().toISOString().slice(0, 16);
                  const isPast = (v.fields.datum_uhrzeit ?? '') < now;
                  return (
                    <div
                      key={v.record_id}
                      onClick={() => setSelectedVersammlung(isSelected ? null : v)}
                      className={`group cursor-pointer rounded-2xl border p-4 transition-all overflow-hidden ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isPast ? 'bg-muted' : 'bg-primary/10'}`}>
                          <IconCalendar size={18} className={isPast ? 'text-muted-foreground' : 'text-primary'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground truncate">
                              {v.fields.thema || 'Vereinsversammlung'}
                            </span>
                            {isPast && <Badge variant="secondary" className="text-xs shrink-0">Vergangen</Badge>}
                            {!isPast && <Badge className="text-xs bg-primary/10 text-primary border-0 shrink-0">Geplant</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {v.fields.datum_uhrzeit && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <IconClock size={12} className="shrink-0" />
                                {formatDate(v.fields.datum_uhrzeit)}
                              </span>
                            )}
                            {v.fields.ort && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <IconMapPin size={12} className="shrink-0" />
                                <span className="truncate max-w-[120px]">{v.fields.ort}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); setVersammlungDialog({ open: true, record: v }); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <IconPencil size={14} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'versammlung', id: v.record_id }); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail */}
          <div>
            {selectedVersammlung ? (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground truncate">{selectedVersammlung.fields.thema || 'Vereinsversammlung'}</h3>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setVersammlungDialog({ open: true, record: selectedVersammlung })}>
                      <IconPencil size={14} className="mr-1 shrink-0" /> Bearbeiten
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ type: 'versammlung', id: selectedVersammlung.record_id })}>
                      <IconTrash size={14} className="shrink-0" />
                    </Button>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Datum & Uhrzeit</p>
                      <p className="font-medium text-foreground">{formatDate(selectedVersammlung.fields.datum_uhrzeit) || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ort</p>
                      <p className="font-medium text-foreground">{selectedVersammlung.fields.ort || '—'}</p>
                    </div>
                  </div>
                  {selectedVersammlung.fields.thema && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Thema / Tagesordnung</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selectedVersammlung.fields.thema}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Teilnehmende Mitglieder</p>
                    {selectedVersammlung.teilnehmerName ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedVersammlung.teilnehmerName.split(', ').filter(Boolean).map((name, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-xl text-sm font-medium">
                            <IconUsers size={12} className="shrink-0" />{name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Keine Teilnehmer erfasst</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[280px] rounded-2xl border border-dashed border-border bg-muted/20 text-center gap-2 p-8">
                <IconCalendar size={40} className="text-muted-foreground" stroke={1.5} />
                <p className="font-medium text-foreground">Versammlung auswählen</p>
                <p className="text-sm text-muted-foreground">Klicke auf eine Versammlung um Details zu sehen</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MITGLIEDER TAB ===== */}
      {activeTab === 'mitglieder' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* List with filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-semibold text-foreground">Mitgliederliste</h2>
              <Button size="sm" onClick={() => setMitgliedDialog({ open: true })}>
                <IconPlus size={16} className="shrink-0 mr-1" />
                <span className="hidden sm:inline">Neues Mitglied</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Suchen..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {(['all', 'aktiv', 'passiv', 'ausgetreten'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                    statusFilter === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {s === 'all' ? 'Alle' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {filteredMitglieder.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card border border-dashed border-border rounded-2xl">
                <IconUsers size={48} className="text-muted-foreground" stroke={1.5} />
                <div>
                  <p className="font-medium text-foreground">Keine Mitglieder gefunden</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{mitgliederverwaltung.length === 0 ? 'Erfasse das erste Vereinsmitglied' : 'Suche anpassen'}</p>
                </div>
                {mitgliederverwaltung.length === 0 && (
                  <Button size="sm" onClick={() => setMitgliedDialog({ open: true })}>
                    <IconPlus size={16} className="mr-1 shrink-0" /> Erstellen
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMitglieder.map(m => {
                  const isSelected = selectedMitglied?.record_id === m.record_id;
                  const statusKey = m.fields.mitgliedsstatus?.key;
                  const beitragOk = !!m.fields.jahresbeitrag_status;
                  return (
                    <div
                      key={m.record_id}
                      onClick={() => setSelectedMitglied(isSelected ? null : m)}
                      className={`group cursor-pointer rounded-2xl border p-4 transition-all overflow-hidden ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                          statusKey === 'aktiv' ? 'bg-primary/10 text-primary' :
                          statusKey === 'passiv' ? 'bg-secondary text-secondary-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {(m.fields.vorname?.[0] ?? '?').toUpperCase()}{(m.fields.nachname?.[0] ?? '').toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground truncate">
                              {[m.fields.vorname, m.fields.nachname].filter(Boolean).join(' ') || 'Unbekannt'}
                            </span>
                            {statusKey && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                                statusKey === 'aktiv' ? 'bg-primary/10 text-primary' :
                                statusKey === 'passiv' ? 'bg-amber-100 text-amber-700' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {m.fields.mitgliedsstatus?.label}
                              </span>
                            )}
                            {!beitragOk && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium shrink-0">Beitrag offen</span>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{m.fields.abteilung || m.fields.email || '—'}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); setMitgliedDialog({ open: true, record: m }); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <IconPencil size={14} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'mitglied', id: m.record_id }); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mitglied Detail */}
          <div>
            {selectedMitglied ? (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      selectedMitglied.fields.mitgliedsstatus?.key === 'aktiv' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {(selectedMitglied.fields.vorname?.[0] ?? '?').toUpperCase()}{(selectedMitglied.fields.nachname?.[0] ?? '').toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-foreground truncate">
                      {[selectedMitglied.fields.vorname, selectedMitglied.fields.nachname].filter(Boolean).join(' ')}
                    </h3>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setMitgliedDialog({ open: true, record: selectedMitglied })}>
                      <IconPencil size={14} className="mr-1 shrink-0" /> Bearbeiten
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ type: 'mitglied', id: selectedMitglied.record_id })}>
                      <IconTrash size={14} className="shrink-0" />
                    </Button>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Status</p>
                      <p className="mt-1">
                        {selectedMitglied.fields.mitgliedsstatus ? (
                          <span className={`text-sm px-2.5 py-1 rounded-xl font-medium ${
                            selectedMitglied.fields.mitgliedsstatus.key === 'aktiv' ? 'bg-primary/10 text-primary' :
                            selectedMitglied.fields.mitgliedsstatus.key === 'passiv' ? 'bg-amber-100 text-amber-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {selectedMitglied.fields.mitgliedsstatus.label}
                          </span>
                        ) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Abteilung</p>
                      <p className="font-medium text-foreground mt-1">{selectedMitglied.fields.abteilung || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Eintrittsdatum</p>
                      <p className="font-medium text-foreground mt-1">{formatDate(selectedMitglied.fields.eintrittsdatum)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Geburtsdatum</p>
                      <p className="font-medium text-foreground mt-1">{formatDate(selectedMitglied.fields.geburtsdatum)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Kontakt</p>
                    {selectedMitglied.fields.email && (
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <IconMail size={14} className="text-muted-foreground shrink-0" />
                        <a href={`mailto:${selectedMitglied.fields.email}`} className="hover:text-primary truncate">{selectedMitglied.fields.email}</a>
                      </div>
                    )}
                    {selectedMitglied.fields.telefonnummer && (
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <IconPhone size={14} className="text-muted-foreground shrink-0" />
                        <a href={`tel:${selectedMitglied.fields.telefonnummer}`} className="hover:text-primary">{selectedMitglied.fields.telefonnummer}</a>
                      </div>
                    )}
                  </div>
                  {(selectedMitglied.fields.strasse || selectedMitglied.fields.ort) && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Adresse</p>
                      <div className="flex items-start gap-2 mt-1 text-sm text-foreground">
                        <IconMapPin size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                        <span>
                          {[selectedMitglied.fields.strasse, selectedMitglied.fields.hausnummer].filter(Boolean).join(' ')}
                          {(selectedMitglied.fields.strasse || selectedMitglied.fields.hausnummer) && (selectedMitglied.fields.postleitzahl || selectedMitglied.fields.ort) ? ', ' : ''}
                          {[selectedMitglied.fields.postleitzahl, selectedMitglied.fields.ort].filter(Boolean).join(' ')}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                    {selectedMitglied.fields.jahresbeitrag_status ? (
                      <>
                        <IconCheck size={16} className="text-primary shrink-0" />
                        <span className="text-sm text-foreground">Jahresbeitrag bezahlt am {formatDate(selectedMitglied.fields.jahresbeitrag_status)}</span>
                      </>
                    ) : (
                      <>
                        <IconX size={16} className="text-destructive shrink-0" />
                        <span className="text-sm text-destructive font-medium">Jahresbeitrag noch nicht bezahlt</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[280px] rounded-2xl border border-dashed border-border bg-muted/20 text-center gap-2 p-8">
                <IconUsers size={40} className="text-muted-foreground" stroke={1.5} />
                <p className="font-medium text-foreground">Mitglied auswählen</p>
                <p className="text-sm text-muted-foreground">Klicke auf ein Mitglied für Details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PICKNICK TAB ===== */}
      {activeTab === 'picknick' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Picknick Events */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">Events</h2>
              <Button size="sm" onClick={() => setPicknickDialog({ open: true })}>
                <IconPlus size={16} className="shrink-0 mr-1" />
                <span className="hidden sm:inline">Neues Event</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </div>
            {sortedPicknick.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-card border border-dashed border-border rounded-2xl">
                <IconBasket size={40} className="text-muted-foreground" stroke={1.5} />
                <div>
                  <p className="font-medium text-foreground">Kein Picknick geplant</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Plant das erste Vereinspicknick</p>
                </div>
                <Button size="sm" onClick={() => setPicknickDialog({ open: true })}>
                  <IconPlus size={16} className="mr-1 shrink-0" /> Erstellen
                </Button>
              </div>
            ) : (
              sortedPicknick.map(p => {
                const isSelected = selectedPicknick?.record_id === p.record_id;
                const now = new Date().toISOString().slice(0, 16);
                const isPast = (p.fields.datum_uhrzeit ?? '') < now;
                return (
                  <div
                    key={p.record_id}
                    onClick={() => { setSelectedPicknick(isSelected ? null : p); setSelectedRezept(null); }}
                    className={`group cursor-pointer rounded-2xl border p-3.5 transition-all overflow-hidden ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${isPast ? 'bg-muted' : 'bg-primary/10'}`}>
                        <IconBasket size={16} className={isPast ? 'text-muted-foreground' : 'text-primary'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-sm truncate">{p.fields.ort || 'Picknick'}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {p.fields.datum_uhrzeit && (
                            <span className="text-xs text-muted-foreground">{formatDate(p.fields.datum_uhrzeit)}</span>
                          )}
                          {p.fields.teilnehmerzahl && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <IconUsers size={11} className="shrink-0" />{p.fields.teilnehmerzahl} Pers.
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); setPicknickDialog({ open: true, record: p }); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <IconPencil size={13} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'picknick', id: p.record_id }); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Rezepte for selected picknick */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">
                {selectedPicknick ? 'Rezepte' : 'Alle Rezepte'}
              </h2>
              <Button size="sm" onClick={() => setRezeptDialog({ open: true })}>
                <IconPlus size={16} className="shrink-0 mr-1" />
                <span className="hidden sm:inline">Neues Rezept</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </div>
            {(selectedPicknick ? rezepteForPicknick : rezepte).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center bg-card border border-dashed border-border rounded-2xl">
                <IconChefHat size={36} className="text-muted-foreground" stroke={1.5} />
                <p className="text-sm font-medium text-foreground">
                  {selectedPicknick ? 'Keine Rezepte verknüpft' : 'Noch keine Rezepte'}
                </p>
              </div>
            ) : (
              (selectedPicknick ? rezepteForPicknick : rezepte).map(r => {
                const isSelected = selectedRezept?.record_id === r.record_id;
                return (
                  <div
                    key={r.record_id}
                    onClick={() => setSelectedRezept(isSelected ? null : r)}
                    className={`group cursor-pointer rounded-2xl border p-3.5 transition-all overflow-hidden ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="shrink-0 w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                        <IconChefHat size={16} className="text-amber-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-sm truncate">{r.fields.rezept_name || 'Rezept'}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {r.fields.rezeptkategorie && (
                            <span className="text-xs px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-lg">{r.fields.rezeptkategorie.label}</span>
                          )}
                          {r.fields.zubereitungszeit && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <IconClock size={11} className="shrink-0" />{r.fields.zubereitungszeit} Min.
                            </span>
                          )}
                          {r.fields.transportierbar && (
                            <span className="text-xs text-primary font-medium">Transportierbar</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setRezeptDialog({ open: true, record: r }); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                      >
                        <IconPencil size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Zutaten for selected Rezept */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">
                {selectedRezept ? 'Zutaten' : 'Alle Zutaten'}
              </h2>
            </div>
            {selectedRezept ? (
              <div>
                <div className="bg-card border border-border rounded-2xl overflow-hidden mb-3">
                  <div className="p-4 border-b border-border">
                    <p className="font-semibold text-foreground">{selectedRezept.fields.rezept_name}</p>
                    {selectedRezept.fields.beschreibung && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedRezept.fields.beschreibung}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRezept.fields.portionen && (
                        <span className="text-xs text-muted-foreground">{selectedRezept.fields.portionen} Portionen</span>
                      )}
                      {selectedRezept.fields.schwierigkeitsgrad && (
                        <span className="text-xs px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-lg">{selectedRezept.fields.schwierigkeitsgrad.label}</span>
                      )}
                    </div>
                  </div>
                  {selectedRezept.fields.zubereitung && (
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Zubereitung</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-6">{selectedRezept.fields.zubereitung}</p>
                    </div>
                  )}
                </div>
                {zutatenForRezept.length > 0 ? (
                  <div className="space-y-2">
                    {zutatenForRezept.map(z => (
                      <div key={z.record_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <IconSalad size={14} className="text-green-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground truncate">{z.fields.zutaten_name}</p>
                          <div className="flex items-center gap-2">
                            {z.fields.kategorie && <span className="text-xs text-muted-foreground">{z.fields.kategorie.label}</span>}
                            {z.fields.masseinheit && <span className="text-xs text-muted-foreground">({z.fields.masseinheit})</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center bg-card border border-dashed border-border rounded-2xl">
                    <IconSalad size={32} className="text-muted-foreground" stroke={1.5} />
                    <p className="text-sm text-muted-foreground">Keine Zutaten verknüpft</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {zutaten.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-center bg-card border border-dashed border-border rounded-2xl">
                    <IconSalad size={36} className="text-muted-foreground" stroke={1.5} />
                    <p className="text-sm text-muted-foreground">Noch keine Zutaten</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {zutaten.slice(0, 20).map(z => (
                      <div key={z.record_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <IconSalad size={14} className="text-green-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground truncate">{z.fields.zutaten_name}</p>
                          <div className="flex items-center gap-2">
                            {z.fields.kategorie && <span className="text-xs text-muted-foreground">{z.fields.kategorie.label}</span>}
                            {z.fields.masseinheit && <span className="text-xs text-muted-foreground">({z.fields.masseinheit})</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {zutaten.length > 20 && (
                      <p className="text-xs text-center text-muted-foreground py-1">+{zutaten.length - 20} weitere</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== DIALOGS ===== */}
      <VereinsversammlungenDialog
        open={versammlungDialog.open}
        onClose={() => setVersammlungDialog({ open: false })}
        onSubmit={async (fields) => {
          if (versammlungDialog.record) {
            await LivingAppsService.updateVereinsversammlungenEntry(versammlungDialog.record.record_id, fields);
          } else {
            await LivingAppsService.createVereinsversammlungenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={versammlungDialog.record?.fields}
        mitgliederverwaltungList={mitgliederverwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['Vereinsversammlungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Vereinsversammlungen']}
      />

      <MitgliederverwaltungDialog
        open={mitgliedDialog.open}
        onClose={() => setMitgliedDialog({ open: false })}
        onSubmit={async (fields) => {
          if (mitgliedDialog.record) {
            await LivingAppsService.updateMitgliederverwaltungEntry(mitgliedDialog.record.record_id, fields);
          } else {
            await LivingAppsService.createMitgliederverwaltungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={mitgliedDialog.record?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Mitgliederverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitgliederverwaltung']}
      />

      <PicknickPlanungDialog
        open={picknickDialog.open}
        onClose={() => setPicknickDialog({ open: false })}
        onSubmit={async (fields) => {
          if (picknickDialog.record) {
            await LivingAppsService.updatePicknickPlanungEntry(picknickDialog.record.record_id, fields);
          } else {
            await LivingAppsService.createPicknickPlanungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={picknickDialog.record?.fields}
        rezepteList={rezepte}
        enablePhotoScan={AI_PHOTO_SCAN['PicknickPlanung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['PicknickPlanung']}
      />

      <RezepteDialog
        open={rezeptDialog.open}
        onClose={() => setRezeptDialog({ open: false })}
        onSubmit={async (fields) => {
          if (rezeptDialog.record) {
            await LivingAppsService.updateRezepteEntry(rezeptDialog.record.record_id, fields);
          } else {
            await LivingAppsService.createRezepteEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={rezeptDialog.record?.fields}
        zutatenList={zutaten}
        enablePhotoScan={AI_PHOTO_SCAN['Rezepte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Rezepte']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
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
      <Skeleton className="h-10 w-80 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
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
