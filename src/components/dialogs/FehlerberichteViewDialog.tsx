import type { Fehlerberichte, Features } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconFileText } from '@tabler/icons-react';

interface FehlerberichteViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Fehlerberichte | null;
  onEdit: (record: Fehlerberichte) => void;
  featuresList: Features[];
}

export function FehlerberichteViewDialog({ open, onClose, record, onEdit, featuresList }: FehlerberichteViewDialogProps) {
  function getFeaturesDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return featuresList.find(r => r.record_id === id)?.fields.feature_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fehlerberichte anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Feature</Label>
            <p className="text-sm">{getFeaturesDisplayName(record.fields.fehler_feature_ref)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fehlerbeschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.fehlerbeschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schweregrad</Label>
            <Badge variant="secondary">{record.fields.fehler_schweregrad?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">AIT-Referenz</Label>
            <p className="text-sm">{record.fields.ait_referenz ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.fehler_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Screenshot</Label>
            {record.fields.fehler_screenshot ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.fehler_screenshot} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}