import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  publicViewingVenues,
  PUBLIC_VIEWING_CITIES,
  type Venue,
  type VenueType,
} from "@/data/publicViewingData";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MapPin, Navigation, Sparkles, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/bars")({
  component: BarsPage,
  head: () => ({
    meta: [
      { title: "Public-Viewing-Bars für die WM 2026 finden — KickTime" },
      { name: "description", content: "Finde Bars und Public-Viewing-Locations für die FIFA WM 2026 in deiner Stadt – ideal, um Spiele gemeinsam mit Freunden zu schauen." },
      { property: "og:title", content: "Public-Viewing-Bars für die WM 2026" },
      { property: "og:description", content: "Bars und Locations für gemeinsames WM-2026-Schauen in deiner Stadt." },
      { property: "og:url", content: "https://kicktime-planer.lovable.app/bars" },
    ],
    links: [{ rel: "canonical", href: "https://kicktime-planer.lovable.app/bars" }],
  }),
});

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
  const [city, setCity] = useState<string>("Berlin");

  const venues = useMemo(
    () => publicViewingVenues.filter((v) => v.city === city),
    [city]
  );

  return (
    <div className="p-4 pb-6">
      <h1 className="text-xl font-bold mb-1">Public-Viewing-Bars für die WM 2026</h1>
      <p className="text-xs text-muted-foreground mb-4">
        Public Viewing, Bars & Biergärten zur WM 2026 in Deutschland.
      </p>

      <div className="rounded-2xl border border-border bg-card p-3 mb-4">
        <label className="text-[10px] uppercase text-muted-foreground font-semibold">
          Stadt
        </label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="h-10 mt-1">
            <SelectValue placeholder="Berlin" />
          </SelectTrigger>
          <SelectContent>
            {PUBLIC_VIEWING_CITIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4">
        {venues.map((v: Venue) => (
          <div key={v.id} className="rounded-2xl border border-border bg-card p-4 flex flex-col">
            <div className="min-w-0">
              <h3 className="text-base font-bold leading-tight">{v.name}</h3>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeBadgeClasses(v.type)}`}
                >
                  {v.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1 mt-2">
                <MapPin className="h-3 w-3 shrink-0 mt-0.5" /> {v.address}
              </p>
            </div>

            <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-snug">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <CalendarClock className="h-3.5 w-3.5 text-primary" />
                Nächstes Spiel
              </div>
              <p className="mt-1 text-foreground">{v.nextMatch}</p>
              <p className="text-muted-foreground">{v.nextMatchKickoff}</p>
            </div>

            <div className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-snug">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
                Atmosphäre
              </div>
              <p className="mt-1 text-muted-foreground">{v.atmosphere}</p>
            </div>

            <Button
              className="w-full mt-3 h-10 font-semibold gap-2"
              onClick={() => window.open(v.googleMapsUrl, "_blank", "noopener,noreferrer")}
            >
              <Navigation className="h-4 w-4" />
              Auf Google Maps anzeigen
            </Button>
          </div>
        ))}
        {venues.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Locations in {city} hinterlegt.
          </p>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-6 leading-relaxed">
        Hinweis: Offizielle Groß-Fanmeilen wie zur EM 2024 gibt es bei der WM 2026 vielerorts
        nicht mehr in derselben Größe. Viele Städte setzen stattdessen auf Bars, Biergärten,
        Eventflächen und temporäre Public-Viewing-Standorte.
      </p>
    </div>
  );
}
