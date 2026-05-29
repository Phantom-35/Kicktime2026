import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  publicViewingVenues,
  PUBLIC_VIEWING_CITIES,
  type Venue,
  type VenueType,
} from "@/data/publicViewingData";
import { getTeam } from "@/data/teams";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { getLocalParts } from "@/lib/time";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MapPin, Clock, Navigation } from "lucide-react";

export const Route = createFileRoute("/bars")({ component: BarsPage });

function typeBadgeClasses(type: VenueType): string {
  switch (type) {
    case "Sportsbar":
      return "bg-primary/15 text-primary border-primary/20";
    case "Biergarten":
      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/20";
    case "Fan Zone / Großbildleinwand":
      return "bg-accent/20 text-accent-foreground border-accent/30";
  }
}

function BarsPage() {
  const matches = useMatchStore(selectMatchList);
  const now = useMatchStore((s) => s.now);
  const [city, setCity] = useState<string>("München");

  const venues = useMemo(
    () => publicViewingVenues.filter((v) => v.city === city),
    [city]
  );

  const nextMatchByCity = useMemo(() => {
    return matches
      .filter((m) => m.city === city && new Date(m.utcTimestamp).getTime() > now - 2 * 60 * 60 * 1000)
      .sort((a, b) => new Date(a.utcTimestamp).getTime() - new Date(b.utcTimestamp).getTime())[0];
  }, [matches, city, now]);

  return (
    <div className="p-4 pb-6">
      <h2 className="text-xl font-bold mb-1">Gastro-Finder</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Public Viewing für Nachtspiele in Deutschland.
      </p>

      <div className="rounded-2xl border border-border bg-card p-3 mb-4">
        <label className="text-[10px] uppercase text-muted-foreground font-semibold">
          Stadt
        </label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="h-10 mt-1">
            <SelectValue placeholder="München" />
          </SelectTrigger>
          <SelectContent>
            {PUBLIC_VIEWING_CITIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4">
        {venues.map((v: Venue) => {
          const next = nextMatchByCity;
          let nextLine = `Kein Match in ${city} geplant`;
          if (next) {
            const a = getTeam(next.teamA);
            const b = getTeam(next.teamB);
            const local = getLocalParts(next.utcTimestamp);
            nextLine = `📺 Nächstes Match hier: ${a.flag} ${a.name} vs. ${b.flag} ${b.name} (${local.dayStr} – ${local.timeStr})`;
          }

          return (
            <div key={v.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold leading-tight">{v.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeBadgeClasses(v.type)}`}
                    >
                      {v.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <MapPin className="h-3 w-3 shrink-0" /> {v.address}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 shrink-0" /> {v.hours}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold whitespace-nowrap">
                  {v.distanceMock}
                </span>
              </div>

              <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-snug">
                {nextLine}
              </div>

              <Button
                className="w-full mt-3 h-10 font-semibold gap-2"
                onClick={() => window.open(v.googleMapsUrl, "_blank", "noopener,noreferrer")}
              >
                <Navigation className="h-4 w-4" />
                Auf Google Maps anzeigen
              </Button>
            </div>
          );
        })}
        {venues.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Locations in {city} hinterlegt.
          </p>
        )}
      </div>
    </div>
  );
}
