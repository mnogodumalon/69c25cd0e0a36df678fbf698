import type { Rezepte, Zutaten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface RezepteViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Rezepte | null;
  onEdit: (record: Rezepte) => void;
  zutatenList: Zutaten[];
}

export function RezepteViewDialog({ open, onClose, record, onEdit, zutatenList }: RezepteViewDialogProps) {
  function getZutatenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return zutatenList.find(r => r.record_id === id)?.fields.zutaten_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rezepte anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rezeptname</Label>
            <p className="text-sm">{record.fields.rezept_name ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.beschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zubereitungszeit (Minuten)</Label>
            <p className="text-sm">{record.fields.zubereitungszeit ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schwierigkeitsgrad</Label>
            <Badge variant="secondary">{record.fields.schwierigkeitsgrad?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Portionen</Label>
            <p className="text-sm">{record.fields.portionen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zutaten</Label>
            <p className="text-sm">{getZutatenDisplayName(record.fields.zutaten_auswahl)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zubereitung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.zubereitung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rezeptkategorie</Label>
            <Badge variant="secondary">{record.fields.rezeptkategorie?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gut transportierbar?</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.transportierbar ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.transportierbar ? 'Ja' : 'Nein'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}