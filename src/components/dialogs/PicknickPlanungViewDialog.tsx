import type { PicknickPlanung, Rezepte } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface PicknickPlanungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: PicknickPlanung | null;
  onEdit: (record: PicknickPlanung) => void;
  rezepteList: Rezepte[];
}

export function PicknickPlanungViewDialog({ open, onClose, record, onEdit, rezepteList }: PicknickPlanungViewDialogProps) {
  function getRezepteDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return rezepteList.find(r => r.record_id === id)?.fields.rezept_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Picknick-Planung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum und Uhrzeit</Label>
            <p className="text-sm">{formatDate(record.fields.datum_uhrzeit)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ort</Label>
            <p className="text-sm">{record.fields.ort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anzahl der Teilnehmer</Label>
            <p className="text-sm">{record.fields.teilnehmerzahl ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rezepte</Label>
            <p className="text-sm">{getRezepteDisplayName(record.fields.rezepte_auswahl)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ausrüstung / Mitbringsel</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.ausruestung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}