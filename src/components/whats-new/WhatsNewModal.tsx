import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Sparkles } from "lucide-react";

type Feature = { icon: typeof Trophy; title: string; text: string };

const FEATURES: Feature[] = [
  {
    icon: Users,
    title: "👥 Team-Deep-Dive im Turnier-Status",
    text: "Tippe im Turnier-Status-Tab auf eine Nation und entdecke Trainer, FIFA-Rang, WM-Titel und den kompletten Kader – sauber nach Positionen sortiert.",
  },
  {
    icon: Trophy,
    title: "🏆 Alle 48 Kader dabei",
    text: "Von Torwart bis Sturm: Der offizielle 26er-Kader aller WM-Teilnehmer ist jetzt direkt in der App abrufbar.",
  },
  {
    icon: Sparkles,
    title: "✨ Flüssig trotz Datenflut",
    text: "Die Kader-Daten werden erst geladen, wenn du sie brauchst – die App bleibt so schnell wie gewohnt.",
  },
];

export function WhatsNewModal({
  open,
  version,
  onClose,
}: {
  open: boolean;
  version: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl border-primary/30 bg-card/95 backdrop-blur">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              v{version}
            </span>
            <DialogTitle className="text-xl">Update v{version}</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Frische Features für dein WM-Erlebnis.
          </p>
        </DialogHeader>

        <ul className="space-y-2.5 mt-2 max-h-[60vh] overflow-y-auto pr-1">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3"
            >
              <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight">{f.title}</div>
                <div className="text-xs text-muted-foreground leading-snug mt-0.5">{f.text}</div>
              </div>
            </li>
          ))}
        </ul>

        <Button className="w-full h-12 mt-2 font-semibold" onClick={onClose}>
          Los geht's ⚽
        </Button>
      </DialogContent>
    </Dialog>
  );
}
