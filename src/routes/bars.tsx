import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BARS, BAR_CITIES } from "@/data/bars";
import { MATCHES } from "@/data/matches";
import { getTeam } from "@/data/teams";
import { useAppStore } from "@/store/app-store";
import { categorizeMatches } from "@/lib/categorize";
import { getLocalParts } from "@/lib/time";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MapPin, Clock, Tv } from "lucide-react";

export const Route = createFileRoute("/bars")({ component: BarsPage });

const RADII = [5, 10, 25, 50] as const;

function BarsPage() {
  const state = useAppStore();
  const [onlyNext, setOnlyNext] = useState(false);
  const [city, setCity] = useState<string>("München");
  const [radius, setRadius] = useState<number>(25);

  const nextPerfectId = useMemo(() => {
    const cats = categorizeMatches(state);
    return cats.perfect[0]?.id;
  }, [state]);

  const bars = useMemo(() => {
    let list = BARS.filter((b) => b.city === city && b.distanceKm <= radius);
    if (onlyNext && nextPerfectId) {
      list = list.filter((b) => b.matchIds.includes(nextPerfectId));
    }
    return list;
  }, [city, radius, onlyNext, nextPerfectId]);

  return (
    <div className="p-4 pb-6">
      <h2 className="text-xl font-bold mb-1">Gastro-Finder</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Public Viewing für Nachtspiele in Deutschland.
      </p>

      {/* Location & radius filter */}
      <div className="rounded-2xl border border-border bg-card p-3 mb-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-semibold">
              Stadt
            </label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-10 mt-1">
                <SelectValue placeholder="München" />
              </SelectTrigger>
              <SelectContent>
                {BAR_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-semibold">
              Umkreis
            </label>
            <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
              <SelectTrigger className="h-10 mt-1 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADII.map((r) => (
                  <SelectItem key={r} value={String(r)}>{r} km</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-3 mb-4">
        <div className="text-xs pr-3">
          <div className="font-semibold">Nur Bars mit nächstem Perfect Match</div>
          {nextPerfectId ? (
            <div className="text-muted-foreground">Filter aktiv für Match {nextPerfectId}</div>
          ) : (
            <div className="text-muted-foreground">Kein Perfect Match verfügbar</div>
          )}
        </div>
        <Switch checked={onlyNext} onCheckedChange={setOnlyNext} disabled={!nextPerfectId} />
      </div>

      <div className="space-y-3">
        {bars.map((b) => {
          const matches = MATCHES
            .filter((m) => b.matchIds.includes(m.id))
            .sort((x, y) => new Date(x.utcTimestamp).getTime() - new Date(y.utcTimestamp).getTime())
            .slice(0, 3);
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
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold whitespace-nowrap">
                  {b.distanceKm} km
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
                onClick={() => window.open(b.website, "_blank", "noopener,noreferrer")}
              >
                Tisch reservieren
              </Button>
            </div>
          );
        })}
        {bars.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Bars in {city} im Umkreis von {radius} km.
          </p>
        )}
      </div>
    </div>
  );
}
