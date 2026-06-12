import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Radio, Lock, Gamepad2, Eye } from "lucide-react";

type Feature = { icon: typeof Radio; title: string; text: string };

const FEATURES: Feature[] = [
  {
    icon: Radio,
    title: "📡 OpenLigaDB",
    text: "Vollständiger Wechsel auf die freie, quelloffene API – absolut krisensicher und ohne Sperren.",
  },
  {
    icon: Lock,
    title: "🔒 PIN-Schutz",
    text: "Das Admin-Dashboard ist ab sofort mit dem Code 5046 vor unbefugtem Zugriff geschützt.",
  },
  {
    icon: Gamepad2,
    title: "🎮 Live-Override",
    text: "Der Admin kann Spielstände im Notfall live manuell überschreiben, falls die API verzögert ist.",
  },
  {
    icon: Eye,
    title: "👁️ Spoiler-Fix",
    text: "Einmal aufgedeckte Ergebnisse bleiben jetzt auch auf den Dashboard-Karten dauerhaft sichtbar.",
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
            <DialogTitle className="text-xl">Update auf v{version} — Unabhängig & Sicher</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Frische Features für dein WM-Erlebnis.
          </p>
        </DialogHeader>

        <ul className="space-y-2.5 mt-2">
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
