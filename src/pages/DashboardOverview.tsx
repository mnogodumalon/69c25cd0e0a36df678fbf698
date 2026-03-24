import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichVereinsversammlungen, enrichRezepte, enrichPicknickPlanung, enrichTestergebnisse, enrichFehlerberichte } from '@/lib/enrich';
import type { EnrichedVereinsversammlungen, EnrichedPicknickPlanung, EnrichedTestergebnisse, EnrichedFehlerberichte } from '@/types/enriched';
import type { Mitgliederverwaltung, Rezepte, Features } from '@/types/app';
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
import { FeaturesDialog } from '@/components/dialogs/FeaturesDialog';
import { TestergebnisseDialog } from '@/components/dialogs/TestergebnisseDialog';
import { FehlerberichteDialog } from '@/components/dialogs/FehlerberichteDialog';
import {
  IconAlertCircle,
  IconPlus,
  IconPencil,
  IconTrash,
  IconCalendarEvent,
  IconUsers,
  IconBasket,
  IconCode,
  IconBug,
  IconClipboardCheck,
  IconMapPin,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconCircleDot,
  IconAlertTriangle,
  IconChefHat,
  IconUsersGroup,
} from '@tabler/icons-react';

type TabKey = 'events' | 'members' | 'picknick' | 'features';

export default function DashboardOverview() {
  const {
    vereinsversammlungen, mitgliederverwaltung, rezepte, zutaten, picknickPlanung, features, testergebnisse, fehlerberichte,
    mitgliederverwaltungMap, rezepteMap, zutatenMap, featuresMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedVereinsversammlungen = enrichVereinsversammlungen(vereinsversammlungen, { mitgliederverwaltungMap });
  const enrichedRezepte = enrichRezepte(rezepte, { zutatenMap });
  const enrichedPicknickPlanung = enrichPicknickPlanung(picknickPlanung, { rezepteMap });
  const enrichedTestergebnisse = enrichTestergebnisse(testergebnisse, { featuresMap });
  const enrichedFehlerberichte = enrichFehlerberichte(fehlerberichte, { featuresMap });

  const [activeTab, setActiveTab] = useState<TabKey>('events');

  // Dialog states
  const [versammlungDialog, setVersammlungDialog] = useState(false);
  const [editVersammlung, setEditVersammlung] = useState<EnrichedVereinsversammlungen | null>(null);
  const [deleteVersammlung, setDeleteVersammlung] = useState<EnrichedVereinsversammlungen | null>(null);

  const [mitgliedDialog, setMitgliedDialog] = useState(false);
  const [editMitglied, setEditMitglied] = useState<Mitgliederverwaltung | null>(null);
  const [deleteMitglied, setDeleteMitglied] = useState<Mitgliederverwaltung | null>(null);

  const [picknickDialog, setPicknickDialog] = useState(false);
  const [editPicknick, setEditPicknick] = useState<EnrichedPicknickPlanung | null>(null);
  const [deletePicknick, setDeletePicknick] = useState<EnrichedPicknickPlanung | null>(null);

  const [rezeptDialog, setRezeptDialog] = useState(false);
  const [editRezept, setEditRezept] = useState<Rezepte | null>(null);
  const [deleteRezept, setDeleteRezept] = useState<Rezepte | null>(null);

  const [featureDialog, setFeatureDialog] = useState(false);
  const [editFeature, setEditFeature] = useState<Features | null>(null);
  const [deleteFeature, setDeleteFeature] = useState<Features | null>(null);

  const [testergebnisDialog, setTestergebnisDialog] = useState(false);
  const [editTestergebnis, setEditTestergebnis] = useState<EnrichedTestergebnisse | null>(null);
  const [deleteTestergebnis, setDeleteTestergebnis] = useState<EnrichedTestergebnisse | null>(null);

  const [fehlerDialog, setFehlerDialog] = useState(false);
  const [editFehler, setEditFehler] = useState<EnrichedFehlerberichte | null>(null);
  const [deleteFehler, setDeleteFehler] = useState<EnrichedFehlerberichte | null>(null);

  // Stats
  const aktiveMembers = useMemo(() => mitgliederverwaltung.filter(m => m.fields.mitgliedsstatus?.key === 'aktiv').length, [mitgliederverwaltung]);
  const offeneFehler = useMemo(() => fehlerberichte.filter(f => f.fields.fehler_status?.key === 'offen').length, [fehlerberichte]);
  const bestandeneTests = useMemo(() => testergebnisse.filter(t => t.fields.test_status?.key === 'bestanden').length, [testergebnisse]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return enrichedVereinsversammlungen
      .filter(v => v.fields.datum_uhrzeit && new Date(v.fields.datum_uhrzeit) >= now)
      .sort((a, b) => new Date(a.fields.datum_uhrzeit!).getTime() - new Date(b.fields.datum_uhrzeit!).getTime())
      .slice(0, 3);
  }, [enrichedVereinsversammlungen]);

  // Sorted versammlungen (upcoming first, then past)
  const sortedVersammlungen = useMemo(() => {
    const now = new Date();
    const upcoming = enrichedVereinsversammlungen
      .filter(v => v.fields.datum_uhrzeit && new Date(v.fields.datum_uhrzeit) >= now)
      .sort((a, b) => new Date(a.fields.datum_uhrzeit!).getTime() - new Date(b.fields.datum_uhrzeit!).getTime());
    const past = enrichedVereinsversammlungen
      .filter(v => !v.fields.datum_uhrzeit || new Date(v.fields.datum_uhrzeit) < now)
      .sort((a, b) => new Date(b.fields.datum_uhrzeit || b.createdat).getTime() - new Date(a.fields.datum_uhrzeit || a.createdat).getTime());
    return [...upcoming, ...past];
  }, [enrichedVereinsversammlungen]);

  const sortedPicknick = useMemo(() => {
    const now = new Date();
    const upcoming = enrichedPicknickPlanung
      .filter(p => p.fields.datum_uhrzeit && new Date(p.fields.datum_uhrzeit) >= now)
      .sort((a, b) => new Date(a.fields.datum_uhrzeit!).getTime() - new Date(b.fields.datum_uhrzeit!).getTime());
    const past = enrichedPicknickPlanung
      .filter(p => !p.fields.datum_uhrzeit || new Date(p.fields.datum_uhrzeit) < now)
      .sort((a, b) => new Date(b.fields.datum_uhrzeit || b.createdat).getTime() - new Date(a.fields.datum_uhrzeit || a.createdat).getTime());
    return [...upcoming, ...past];
  }, [enrichedPicknickPlanung]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'events', label: 'Versammlungen', icon: <IconCalendarEvent size={16} className="shrink-0" />, count: vereinsversammlungen.length },
    { key: 'members', label: 'Mitglieder', icon: <IconUsers size={16} className="shrink-0" />, count: mitgliederverwaltung.length },
    { key: 'picknick', label: 'Picknick & Rezepte', icon: <IconBasket size={16} className="shrink-0" />, count: picknickPlanung.length },
    { key: 'features', label: 'Features & Tests', icon: <IconCode size={16} className="shrink-0" />, count: features.length },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Aktive Mitglieder"
          value={String(aktiveMembers)}
          description={`von ${mitgliederverwaltung.length} gesamt`}
          icon={<IconUsersGroup size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Versammlungen"
          value={String(upcomingEvents.length)}
          description="demnächst"
          icon={<IconCalendarEvent size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offene Fehler"
          value={String(offeneFehler)}
          description={`von ${fehlerberichte.length} gesamt`}
          icon={<IconBug size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Tests bestanden"
          value={String(bestandeneTests)}
          description={`von ${testergebnisse.length} gesamt`}
          icon={<IconClipboardCheck size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Upcoming events teaser */}
      {upcomingEvents.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Nächste Versammlungen</p>
          <div className="flex flex-wrap gap-2">
            {upcomingEvents.map(v => (
              <div key={v.record_id} className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 text-sm">
                <IconCalendarEvent size={14} className="text-primary shrink-0" />
                <span className="font-medium text-foreground truncate max-w-[180px]">{v.fields.thema || 'Versammlung'}</span>
                <span className="text-muted-foreground text-xs shrink-0">{formatDate(v.fields.datum_uhrzeit)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Versammlungen */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Vereinsversammlungen</h2>
            <Button size="sm" onClick={() => { setEditVersammlung(null); setVersammlungDialog(true); }}>
              <IconPlus size={16} className="shrink-0 mr-1" />
              <span className="hidden sm:inline">Neue Versammlung</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </div>

          {sortedVersammlungen.length === 0 ? (
            <EmptyState icon={<IconCalendarEvent size={48} className="text-muted-foreground" />} title="Keine Versammlungen" description="Erstelle die erste Vereinsversammlung." />
          ) : (
            <div className="space-y-3">
              {sortedVersammlungen.map(v => {
                const isUpcoming = v.fields.datum_uhrzeit && new Date(v.fields.datum_uhrzeit) >= new Date();
                return (
                  <div key={v.record_id} className={`rounded-2xl border bg-card p-4 ${isUpcoming ? 'border-primary/30' : 'border-border'}`}>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${isUpcoming ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{v.fields.thema || 'Ohne Thema'}</h3>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => { setEditVersammlung(v); setVersammlungDialog(true); }}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            >
                              <IconPencil size={14} className="text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => setDeleteVersammlung(v)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                            >
                              <IconTrash size={14} className="text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          {v.fields.datum_uhrzeit && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <IconClock size={12} className="shrink-0" />
                              {formatDate(v.fields.datum_uhrzeit)}
                            </span>
                          )}
                          {v.fields.ort && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <IconMapPin size={12} className="shrink-0" />
                              <span className="truncate max-w-[150px]">{v.fields.ort}</span>
                            </span>
                          )}
                          {isUpcoming && <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">Bevorstehend</Badge>}
                        </div>
                        {v.teilnehmerName && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <IconUsers size={12} className="shrink-0" />
                            <span className="truncate">{v.teilnehmerName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Mitglieder */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Mitgliederverwaltung</h2>
            <Button size="sm" onClick={() => { setEditMitglied(null); setMitgliedDialog(true); }}>
              <IconPlus size={16} className="shrink-0 mr-1" />
              <span className="hidden sm:inline">Neues Mitglied</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </div>

          {/* Status filter summary */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'aktiv', label: 'Aktiv', color: 'bg-green-100 text-green-700 border-green-200' },
              { key: 'passiv', label: 'Passiv', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
              { key: 'ausgetreten', label: 'Ausgetreten', color: 'bg-red-100 text-red-700 border-red-200' },
            ].map(s => {
              const count = mitgliederverwaltung.filter(m => m.fields.mitgliedsstatus?.key === s.key).length;
              return (
                <span key={s.key} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${s.color}`}>
                  {s.label}: {count}
                </span>
              );
            })}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-muted text-muted-foreground">
              Gesamt: {mitgliederverwaltung.length}
            </span>
          </div>

          {mitgliederverwaltung.length === 0 ? (
            <EmptyState icon={<IconUsers size={48} className="text-muted-foreground" />} title="Keine Mitglieder" description="Füge das erste Mitglied hinzu." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">E-Mail</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Abteilung</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Beitrag</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {mitgliederverwaltung.map(m => (
                    <tr key={m.record_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{[m.fields.vorname, m.fields.nachname].filter(Boolean).join(' ') || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        <span className="truncate block max-w-[180px]">{m.fields.email || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{m.fields.abteilung || '—'}</td>
                      <td className="px-4 py-3">
                        <MitgliedStatusBadge status={m.fields.mitgliedsstatus?.key} label={m.fields.mitgliedsstatus?.label} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {m.fields.jahresbeitrag_status ? formatDate(m.fields.jahresbeitrag_status) : <span className="text-destructive/70">Ausstehend</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditMitglied(m); setMitgliedDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <IconPencil size={14} className="text-muted-foreground" />
                          </button>
                          <button onClick={() => setDeleteMitglied(m)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                            <IconTrash size={14} className="text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Picknick & Rezepte */}
      {activeTab === 'picknick' && (
        <div className="space-y-6">
          {/* Picknick Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <IconBasket size={18} className="text-primary shrink-0" />
                Picknick-Planung
              </h2>
              <Button size="sm" onClick={() => { setEditPicknick(null); setPicknickDialog(true); }}>
                <IconPlus size={16} className="shrink-0 mr-1" />
                <span className="hidden sm:inline">Neues Picknick</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </div>

            {sortedPicknick.length === 0 ? (
              <EmptyState icon={<IconBasket size={48} className="text-muted-foreground" />} title="Keine Picknicks geplant" description="Plane das erste Vereinspicknick." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedPicknick.map(p => {
                  const isUpcoming = p.fields.datum_uhrzeit && new Date(p.fields.datum_uhrzeit) >= new Date();
                  return (
                    <div key={p.record_id} className={`rounded-2xl border bg-card p-4 ${isUpcoming ? 'border-primary/30' : 'border-border'}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-foreground truncate">{p.fields.ort || 'Ort unbekannt'}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { setEditPicknick(p); setPicknickDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <IconPencil size={14} className="text-muted-foreground" />
                          </button>
                          <button onClick={() => setDeletePicknick(p)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                            <IconTrash size={14} className="text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {p.fields.datum_uhrzeit && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconClock size={12} className="shrink-0" />
                            {formatDate(p.fields.datum_uhrzeit)}
                            {isUpcoming && <Badge variant="secondary" className="ml-1 text-xs bg-primary/10 text-primary border-primary/20">Bald</Badge>}
                          </p>
                        )}
                        {p.fields.teilnehmerzahl && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconUsers size={12} className="shrink-0" />
                            {p.fields.teilnehmerzahl} Teilnehmer
                          </p>
                        )}
                        {p.rezepte_auswahlName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconChefHat size={12} className="shrink-0" />
                            <span className="truncate">{p.rezepte_auswahlName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rezepte */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <IconChefHat size={18} className="text-primary shrink-0" />
                Rezepte
              </h2>
              <Button size="sm" onClick={() => { setEditRezept(null); setRezeptDialog(true); }}>
                <IconPlus size={16} className="shrink-0 mr-1" />
                <span className="hidden sm:inline">Neues Rezept</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </div>

            {enrichedRezepte.length === 0 ? (
              <EmptyState icon={<IconChefHat size={48} className="text-muted-foreground" />} title="Keine Rezepte" description="Füge das erste Rezept hinzu." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {enrichedRezepte.map(r => (
                  <div key={r.record_id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground truncate">{r.fields.rezept_name || 'Unbenannt'}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditRezept(r); setRezeptDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <IconPencil size={14} className="text-muted-foreground" />
                        </button>
                        <button onClick={() => setDeleteRezept(r)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                          <IconTrash size={14} className="text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {r.fields.rezeptkategorie && (
                        <Badge variant="secondary" className="text-xs">{r.fields.rezeptkategorie.label}</Badge>
                      )}
                      {r.fields.schwierigkeitsgrad && (
                        <Badge variant="outline" className={`text-xs ${r.fields.schwierigkeitsgrad.key === 'einfach' ? 'border-green-300 text-green-700' : r.fields.schwierigkeitsgrad.key === 'schwierig' ? 'border-red-300 text-red-700' : 'border-yellow-300 text-yellow-700'}`}>
                          {r.fields.schwierigkeitsgrad.label}
                        </Badge>
                      )}
                      {r.fields.transportierbar && (
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">Transportierbar</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {r.fields.zubereitungszeit && (
                        <span className="text-xs text-muted-foreground">{r.fields.zubereitungszeit} Min.</span>
                      )}
                      {r.fields.portionen && (
                        <span className="text-xs text-muted-foreground">{r.fields.portionen} Portionen</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Features & Tests */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          {/* Features Kanban-style by priority */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <IconCode size={18} className="text-primary shrink-0" />
                Features
              </h2>
              <Button size="sm" onClick={() => { setEditFeature(null); setFeatureDialog(true); }}>
                <IconPlus size={16} className="shrink-0 mr-1" />
                <span className="hidden sm:inline">Neues Feature</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </div>

            {features.length === 0 ? (
              <EmptyState icon={<IconCode size={48} className="text-muted-foreground" />} title="Keine Features" description="Erfasse das erste Feature." />
            ) : (
              <div className="space-y-2">
                {['hoch', 'mittel', 'niedrig'].map(prio => {
                  const group = features.filter(f => f.fields.feature_prioritaet?.key === prio);
                  if (group.length === 0) return null;
                  return (
                    <div key={prio} className="rounded-2xl border border-border bg-card overflow-hidden">
                      <div className={`px-4 py-2 border-b border-border flex items-center gap-2 ${prio === 'hoch' ? 'bg-red-50' : prio === 'mittel' ? 'bg-yellow-50' : 'bg-green-50'}`}>
                        <IconAlertTriangle size={14} className={`shrink-0 ${prio === 'hoch' ? 'text-red-600' : prio === 'mittel' ? 'text-yellow-600' : 'text-green-600'}`} />
                        <span className={`text-xs font-semibold ${prio === 'hoch' ? 'text-red-700' : prio === 'mittel' ? 'text-yellow-700' : 'text-green-700'}`}>
                          Priorität: {prio === 'hoch' ? 'Hoch' : prio === 'mittel' ? 'Mittel' : 'Niedrig'} ({group.length})
                        </span>
                      </div>
                      <div className="divide-y divide-border">
                        {group.map(f => {
                          const featureTests = enrichedTestergebnisse.filter(t => t.feature_refName === f.fields.feature_name);
                          const featureFehler = enrichedFehlerberichte.filter(e => e.fehler_feature_refName === f.fields.feature_name && e.fields.fehler_status?.key === 'offen');
                          return (
                            <div key={f.record_id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-foreground truncate">{f.fields.feature_name || 'Unbenannt'}</span>
                                  {f.fields.feature_kategorie && (
                                    <Badge variant="secondary" className="text-xs shrink-0">{f.fields.feature_kategorie.label}</Badge>
                                  )}
                                  {featureFehler.length > 0 && (
                                    <Badge variant="destructive" className="text-xs shrink-0">{featureFehler.length} Fehler</Badge>
                                  )}
                                  {featureTests.length > 0 && (
                                    <span className="text-xs text-muted-foreground shrink-0">{featureTests.length} Test(s)</span>
                                  )}
                                </div>
                                {f.fields.feature_beschreibung && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{f.fields.feature_beschreibung}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => { setEditFeature(f); setFeatureDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                  <IconPencil size={14} className="text-muted-foreground" />
                                </button>
                                <button onClick={() => setDeleteFeature(f)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                  <IconTrash size={14} className="text-muted-foreground" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {/* Features without priority */}
                {features.filter(f => !f.fields.feature_prioritaet).map(f => (
                  <div key={f.record_id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{f.fields.feature_name || 'Unbenannt'}</span>
                      {f.fields.feature_kategorie && (
                        <Badge variant="secondary" className="text-xs ml-2">{f.fields.feature_kategorie.label}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditFeature(f); setFeatureDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <IconPencil size={14} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => setDeleteFeature(f)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                        <IconTrash size={14} className="text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Testergebnisse */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <IconClipboardCheck size={18} className="text-primary shrink-0" />
                Testergebnisse
              </h2>
              <Button size="sm" onClick={() => { setEditTestergebnis(null); setTestergebnisDialog(true); }}>
                <IconPlus size={16} className="shrink-0 mr-1" />
                <span className="hidden sm:inline">Neuer Test</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </div>

            {enrichedTestergebnisse.length === 0 ? (
              <EmptyState icon={<IconClipboardCheck size={48} className="text-muted-foreground" />} title="Keine Testergebnisse" description="Dokumentiere das erste Testergebnis." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Feature</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Tester</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Datum</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedTestergebnisse.map(t => (
                      <tr key={t.record_id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground truncate max-w-[150px]">{t.feature_refName || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{t.fields.tester_name || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{t.fields.testdatum ? formatDate(t.fields.testdatum) : '—'}</td>
                        <td className="px-4 py-3">
                          <TestStatusBadge status={t.fields.test_status?.key} label={t.fields.test_status?.label} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditTestergebnis(t); setTestergebnisDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                              <IconPencil size={14} className="text-muted-foreground" />
                            </button>
                            <button onClick={() => setDeleteTestergebnis(t)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                              <IconTrash size={14} className="text-muted-foreground" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Fehlerberichte */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <IconBug size={18} className="text-primary shrink-0" />
                Fehlerberichte
              </h2>
              <Button size="sm" onClick={() => { setEditFehler(null); setFehlerDialog(true); }}>
                <IconPlus size={16} className="shrink-0 mr-1" />
                <span className="hidden sm:inline">Neuer Fehlerbericht</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </div>

            {enrichedFehlerberichte.length === 0 ? (
              <EmptyState icon={<IconBug size={48} className="text-muted-foreground" />} title="Keine Fehlerberichte" description="Melde den ersten Fehler." />
            ) : (
              <div className="space-y-2">
                {enrichedFehlerberichte.map(f => (
                  <div key={f.record_id} className={`rounded-2xl border bg-card p-4 ${f.fields.fehler_status?.key === 'offen' ? 'border-destructive/30' : 'border-border'}`}>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <FehlerSchwereradBadge schweregrad={f.fields.fehler_schweregrad?.key} label={f.fields.fehler_schweregrad?.label} />
                              <FehlerStatusBadge status={f.fields.fehler_status?.key} label={f.fields.fehler_status?.label} />
                              {f.fehler_feature_refName && (
                                <span className="text-xs text-muted-foreground">→ {f.fehler_feature_refName}</span>
                              )}
                              {f.fields.ait_referenz && (
                                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{f.fields.ait_referenz}</span>
                              )}
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">{f.fields.fehlerbeschreibung || '—'}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => { setEditFehler(f); setFehlerDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                              <IconPencil size={14} className="text-muted-foreground" />
                            </button>
                            <button onClick={() => setDeleteFehler(f)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                              <IconTrash size={14} className="text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <VereinsversammlungenDialog
        open={versammlungDialog}
        onClose={() => { setVersammlungDialog(false); setEditVersammlung(null); }}
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

      <MitgliederverwaltungDialog
        open={mitgliedDialog}
        onClose={() => { setMitgliedDialog(false); setEditMitglied(null); }}
        onSubmit={async (fields) => {
          if (editMitglied) {
            await LivingAppsService.updateMitgliederverwaltungEntry(editMitglied.record_id, fields);
          } else {
            await LivingAppsService.createMitgliederverwaltungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editMitglied?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Mitgliederverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitgliederverwaltung']}
      />

      <PicknickPlanungDialog
        open={picknickDialog}
        onClose={() => { setPicknickDialog(false); setEditPicknick(null); }}
        onSubmit={async (fields) => {
          if (editPicknick) {
            await LivingAppsService.updatePicknickPlanungEntry(editPicknick.record_id, fields);
          } else {
            await LivingAppsService.createPicknickPlanungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editPicknick?.fields}
        rezepteList={rezepte}
        enablePhotoScan={AI_PHOTO_SCAN['PicknickPlanung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['PicknickPlanung']}
      />

      <RezepteDialog
        open={rezeptDialog}
        onClose={() => { setRezeptDialog(false); setEditRezept(null); }}
        onSubmit={async (fields) => {
          if (editRezept) {
            await LivingAppsService.updateRezepteEntry(editRezept.record_id, fields);
          } else {
            await LivingAppsService.createRezepteEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editRezept?.fields}
        zutatenList={zutaten}
        enablePhotoScan={AI_PHOTO_SCAN['Rezepte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Rezepte']}
      />

      <FeaturesDialog
        open={featureDialog}
        onClose={() => { setFeatureDialog(false); setEditFeature(null); }}
        onSubmit={async (fields) => {
          if (editFeature) {
            await LivingAppsService.updateFeature(editFeature.record_id, fields);
          } else {
            await LivingAppsService.createFeature(fields);
          }
          fetchAll();
        }}
        defaultValues={editFeature?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Features']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Features']}
      />

      <TestergebnisseDialog
        open={testergebnisDialog}
        onClose={() => { setTestergebnisDialog(false); setEditTestergebnis(null); }}
        onSubmit={async (fields) => {
          if (editTestergebnis) {
            await LivingAppsService.updateTestergebnisseEntry(editTestergebnis.record_id, fields);
          } else {
            await LivingAppsService.createTestergebnisseEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editTestergebnis?.fields}
        featuresList={features}
        enablePhotoScan={AI_PHOTO_SCAN['Testergebnisse']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Testergebnisse']}
      />

      <FehlerberichteDialog
        open={fehlerDialog}
        onClose={() => { setFehlerDialog(false); setEditFehler(null); }}
        onSubmit={async (fields) => {
          if (editFehler) {
            await LivingAppsService.updateFehlerberichteEntry(editFehler.record_id, fields);
          } else {
            await LivingAppsService.createFehlerberichteEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editFehler?.fields}
        featuresList={features}
        enablePhotoScan={AI_PHOTO_SCAN['Fehlerberichte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Fehlerberichte']}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={!!deleteVersammlung}
        title="Versammlung löschen"
        description={`"${deleteVersammlung?.fields.thema || 'Diese Versammlung'}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteVersammlung) {
            await LivingAppsService.deleteVereinsversammlungenEntry(deleteVersammlung.record_id);
            setDeleteVersammlung(null);
            fetchAll();
          }
        }}
        onClose={() => setDeleteVersammlung(null)}
      />

      <ConfirmDialog
        open={!!deleteMitglied}
        title="Mitglied löschen"
        description={`"${[deleteMitglied?.fields.vorname, deleteMitglied?.fields.nachname].filter(Boolean).join(' ') || 'Dieses Mitglied'}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteMitglied) {
            await LivingAppsService.deleteMitgliederverwaltungEntry(deleteMitglied.record_id);
            setDeleteMitglied(null);
            fetchAll();
          }
        }}
        onClose={() => setDeleteMitglied(null)}
      />

      <ConfirmDialog
        open={!!deletePicknick}
        title="Picknick löschen"
        description={`Picknick in "${deletePicknick?.fields.ort || 'unbekannt'}" wirklich löschen?`}
        onConfirm={async () => {
          if (deletePicknick) {
            await LivingAppsService.deletePicknickPlanungEntry(deletePicknick.record_id);
            setDeletePicknick(null);
            fetchAll();
          }
        }}
        onClose={() => setDeletePicknick(null)}
      />

      <ConfirmDialog
        open={!!deleteRezept}
        title="Rezept löschen"
        description={`"${deleteRezept?.fields.rezept_name || 'Dieses Rezept'}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteRezept) {
            await LivingAppsService.deleteRezepteEntry(deleteRezept.record_id);
            setDeleteRezept(null);
            fetchAll();
          }
        }}
        onClose={() => setDeleteRezept(null)}
      />

      <ConfirmDialog
        open={!!deleteFeature}
        title="Feature löschen"
        description={`"${deleteFeature?.fields.feature_name || 'Dieses Feature'}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteFeature) {
            await LivingAppsService.deleteFeature(deleteFeature.record_id);
            setDeleteFeature(null);
            fetchAll();
          }
        }}
        onClose={() => setDeleteFeature(null)}
      />

      <ConfirmDialog
        open={!!deleteTestergebnis}
        title="Testergebnis löschen"
        description="Dieses Testergebnis wirklich löschen?"
        onConfirm={async () => {
          if (deleteTestergebnis) {
            await LivingAppsService.deleteTestergebnisseEntry(deleteTestergebnis.record_id);
            setDeleteTestergebnis(null);
            fetchAll();
          }
        }}
        onClose={() => setDeleteTestergebnis(null)}
      />

      <ConfirmDialog
        open={!!deleteFehler}
        title="Fehlerbericht löschen"
        description="Diesen Fehlerbericht wirklich löschen?"
        onConfirm={async () => {
          if (deleteFehler) {
            await LivingAppsService.deleteFehlerberichteEntry(deleteFehler.record_id);
            setDeleteFehler(null);
            fetchAll();
          }
        }}
        onClose={() => setDeleteFehler(null)}
      />
    </div>
  );
}

function MitgliedStatusBadge({ status, label }: { status?: string; label?: string }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    aktiv: 'bg-green-100 text-green-700 border-green-200',
    passiv: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    ausgetreten: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${colors[status] || 'bg-muted text-muted-foreground'}`}>
      {label || status}
    </span>
  );
}

function TestStatusBadge({ status, label }: { status?: string; label?: string }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  if (status === 'bestanden') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
      <IconCircleCheck size={14} className="shrink-0" />{label}
    </span>
  );
  if (status === 'fehlgeschlagen') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
      <IconCircleX size={14} className="shrink-0" />{label}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700">
      <IconCircleDot size={14} className="shrink-0" />{label}
    </span>
  );
}

function FehlerStatusBadge({ status, label }: { status?: string; label?: string }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    offen: 'bg-red-100 text-red-700 border-red-200',
    in_bearbeitung: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    behoben: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${colors[status] || 'bg-muted text-muted-foreground'}`}>
      {label || status}
    </span>
  );
}

function FehlerSchwereradBadge({ schweregrad, label }: { schweregrad?: string; label?: string }) {
  if (!schweregrad) return null;
  const colors: Record<string, string> = {
    kritisch: 'bg-red-600 text-white',
    hoch: 'bg-orange-500 text-white',
    mittel: 'bg-yellow-500 text-white',
    niedrig: 'bg-blue-500 text-white',
  };
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded ${colors[schweregrad] || 'bg-muted text-muted-foreground'}`}>
      {label || schweregrad}
    </span>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon}
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
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
