import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BellOff, Trophy, Circle, Filter, Table2, Tv, Settings2 } from "lucide-react";

type Feature = { icon: typeof BellOff; title: string; text: string };

const FEATURES: Feature[] = [
  {
    icon: Tv,
    title: "📺 Jetzt im TV",
    text: "Wir haben das Wording für laufende Spiele angepasst – kein irreführender Sekunden-Ticker mehr. Du siehst sofort auf einen Blick, was aktuell im Fernsehen läuft.",
  },
  {
    icon: Settings2,
    title: "⚙️ Admin: Phasen-Auswahl",
    text: "Im Admin-Override gibt es jetzt eine saubere Auswahl zwischen 1. Halbzeit, Halbzeitpause und 2. Halbzeit statt händischer Minuten-Eingabe.",
  },
  {
    icon: BellOff,
    title: "🔕 Globaler Push-Sync",
    text: "Deaktivierst du Push in den Einstellungen, werden ALLE Spiel-Alarme automatisch ausgeschaltet. Die Glocken auf Dashboard & Spiele-Tab zeigen sofort den korrekten Status.",
  },
  {
    icon: Trophy,
    title: "🏆 Automatisch zur K.-o.-Runde",
    text: "Sobald die Gruppenphase vorbei ist, wechselt das Banner auf „K.-o.-Runde“. Platzhalter wie „1. Gruppe A“ werden in den KO-Spielen automatisch durch die echten Teams ersetzt.",
  },
  {
    icon: Circle,
    title: "🟢🟡 Dynamisches Ampelsystem",
    text: "Match-Cards bekommen jetzt einen smarten Farbpunkt: Grün, wenn ein Top-Team dabei ist, Gelb für ein interessantes Team – sonst bleibt's clean.",
  },
  {
    icon: Filter,
    title: "⭐ Strikter Top-Filter",
    text: "Die „Top“-Pille zeigt jetzt exakt: Eröffnungsspiel, alle Deutschland-Partien sowie Viertelfinale, Halbfinale und Finale.",
  },
  {
    icon: Table2,
    title: "🎯 Highlight in der Mini-Tabelle",
    text: "In der Detailansicht eines Spiels werden die beiden beteiligten Teams in der Gruppentabelle jetzt dezent hervorgehoben – die Tabellenposition siehst du auf einen Blick.",
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
