import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BARS } from "@/data/bars";
import { MATCHES } from "@/data/matches";
import { getTeam } from "@/data/teams";
import { useAppStore } from "@/store/app-store";
import { categorizeMatches } from "@/lib/categorize";
import { getLocalParts } from "@/lib/time";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Tv } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/bars")({ component: BarsPage });

function BarsPage() {
  const state = useAppStore();
  const [onlyNext, setOnlyNext] = useState(false);
  const nextPerfectId = useMemo(() => {
    const cats = categorizeMatches(state);
    return cats.perfect[0]?.id;
  }, [state]);

  const bars = useMemo(() => {
    if (!onlyNext || !nextPerfectId) return BARS;
    return BARS.filter((b) => b.matchIds.includes(nextPerfectId));
  }, [onlyNext, nextPerfectId]);

  return (
    <div className="p-4 pb-6">
      <h2 className="text-xl font-bold mb-1">Gastro-Finder</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Public Viewing für Nachtspiele in Deutschland.
      </p>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-3 mb-4">
        <div className="text-xs">
          <div className="font-semibold">Nur Bars, die mein nächstes Perfect Match zeigen</div>
          {nextPerfectId && (
            <div className="text-muted-foreground">Filter aktiv für Match {nextPerfectId}</div>
          )}
        </div>
        <Switch checked={onlyNext} onCheckedChange={setOnlyNext} disabled={!nextPerfectId} />
      </div>

      <div className="space-y-3">
        {bars.map((b) => {
          const matches = MATCHES.filter((m) => b.matchIds.includes(m.id)).slice(0, 3);
          return (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">{b.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {b.address}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {b.hours}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                  {b.city}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                  <Tv className="h-3 w-3" /> Zeigt u.a.
                </div>
                {matches.map((m) => {
                  const a = getTeam(m.teamA), bt = getTeam(m.teamB);
                  const local = getLocalParts(m.utcTimestamp, state.userTimezone);
                  return (
                    <div key={m.id} className="text-xs flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5">
                      <span>{a.flag} {a.name} – {bt.flag} {bt.name}</span>
                      <span className="tabular-nums text-muted-foreground">{local.timeStr}</span>
                    </div>
                  );
                })}
              </div>

              <Button
                className="w-full mt-3 h-10 font-semibold"
                onClick={() => toast.success(`Tisch bei ${b.name} angefragt!`)}
              >
                Tisch reservieren
              </Button>
            </div>
          );
        })}
        {bars.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Bars für diesen Filter.
          </p>
        )}
      </div>
    </div>
  );
}
