import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Radio, ArrowUpToLine, Star } from "lucide-react";

type Feature = { icon: typeof Radio; title: string; text: string };

const FEATURES: Feature[] = [
  {
    icon: Radio,
    title: "🔴 Live-Fokus",
    text: "Laufende Spiele springen dir direkt ins Auge! Eine kompakte Live-Sektion bringt dich mit einem Klick zu den Details, alle laufenden Partien bekommen einen dynamischen roten Rahmen.",
  },
  {
    icon: ArrowUpToLine,
    title: "⬆️ Smart-Scroll im Spielplan",
    text: "Kein endloses Scrollen mehr an alten Partien vorbei. Der Spiele-Tab springt ab jetzt automatisch zum aktuellen Tag.",
  },
  {
    icon: Star,
    title: "⭐ Top-Spiele Filter",
    text: "Über die neue Filter-Pille auf dem Dashboard findest du absolute Highlight-Matches und K.o.-Spiele blitzschnell auf einen Blick.",
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
