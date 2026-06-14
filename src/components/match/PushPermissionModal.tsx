import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BellOff } from "lucide-react";

export function PushPermissionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl border-primary/30 bg-card/95 backdrop-blur">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mb-2">
            <BellOff className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg">
            Benachrichtigungen aktivieren
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-center leading-snug">
          Um Spiel-Erinnerungen zu erhalten, aktiviere bitte zuerst die Mitteilungen in
          deinen Geräteeinstellungen für diese App.
        </p>
        <Button className="w-full h-11 mt-2 font-semibold" onClick={onClose}>
          Verstanden
        </Button>
      </DialogContent>
    </Dialog>
  );
}
