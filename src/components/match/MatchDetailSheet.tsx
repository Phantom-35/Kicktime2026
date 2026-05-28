import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Match } from "@/data/matches";
import { getTeam } from "@/data/teams";
import { getGroupStandings } from "@/data/groups";
import { useAppStore } from "@/store/app-store";
import { getLocalParts } from "@/lib/time";
import { Tv, Plane, MapPin } from "lucide-react";


function getBroadcasterUrl(broadcaster: string): string {
  switch (broadcaster) {
    case "MagentaTV":
      return "https://www.magentatv.de";
    case "ARD":
      return "https://www.ardmediathek.de";
    case "ZDF":
      return "https://www.zdf.de";
    default:
      return "https://www.google.com/search?q=" + encodeURIComponent(broadcaster + " live stream");
  }
}

export function MatchDetailSheet({
  match, open, onOpenChange,
}: {
  match: Match | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const tz = useAppStore((s) => s.userTimezone);
  const spoiler = useAppStore((s) => s.spoilerProtection);
  const [revealed, setRevealed] = useState(false);
  if (!match) return null;
  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);
  const local = getLocalParts(match.utcTimestamp, tz);
  const standings = getGroupStandings(match.group);
  const hideFinishedScore = spoiler && match.status === "finished" && !revealed;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto border-border bg-background">
        <SheetHeader className="text-left">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted" />
          <SheetTitle className="flex items-center gap-2">
            <span className="text-2xl">{a.flag}</span>
            <span>{a.name}</span>
            <span className="text-muted-foreground mx-1">vs</span>
            <span className="text-2xl">{b.flag}</span>
            <span>{b.name}</span>
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{local.fullStr} · Gruppe {match.group}</p>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Score (finished) with spoiler */}
          {match.status === "finished" && match.score && (
            <div className="rounded-2xl border border-border bg-card p-4 text-center relative">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Endstand
              </div>
              <div className={`text-3xl font-black tabular-nums ${hideFinishedScore ? "blur-md select-none" : ""}`}>
                {match.score.a} : {match.score.b}
              </div>
              {hideFinishedScore && (
                <button
                  onClick={() => setRevealed(true)}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto w-fit text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground font-semibold shadow-lg"
                >
                  Ergebnis aufdecken
                </button>
              )}
            </div>
          )}

          {/* Broadcaster */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Tv className="h-3.5 w-3.5" /> Live im TV
            </div>
            <div className="flex flex-col gap-3 w-full">
              <div className="flex flex-wrap items-center gap-2">
                {(match.broadcasters ?? [match.broadcaster]).map((bc) => (
                  <span
                    key={bc}
                    className="text-lg font-black tracking-tight text-primary bg-primary/10 border border-primary/30 rounded-lg px-3 py-1"
                  >
                    {bc}
                  </span>
                ))}
              </div>
              {(match.broadcasters ?? [match.broadcaster]).map((bc) => (
                <Button
                  key={bc}
                  variant={bc === "MagentaTV" ? "default" : "outline"}
                  onClick={() => {
                    window.open(getBroadcasterUrl(bc), "_blank", "noopener,noreferrer");
                  }}
                  className="h-11 w-full font-semibold"
                >
                  {bc} öffnen
                </Button>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 gap-2">
            <Insight icon={<MapPin className="h-4 w-4" />} label="Stadion" value={`${match.stadium}, ${match.city}`} />
            <Insight icon={<Plane className="h-4 w-4" />} label="Anreise & Transit" value={match.travelInfo} />
          </div>

          {/* Standings */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 text-xs font-semibold text-muted-foreground">
              Gruppe {match.group} · Tabelle
            </div>
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-muted-foreground">
                <tr>
                  <th className="text-left pl-4 py-1.5">Team</th>
                  <th className="text-center py-1.5">Sp</th>
                  <th className="text-center py-1.5">TD</th>
                  <th className="text-right pr-4 py-1.5">Pkt</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => {
                  const t = getTeam(row.code);
                  const highlight = row.code === match.teamA || row.code === match.teamB;
                  return (
                    <tr key={row.code} className={highlight ? "bg-primary/15" : ""}>
                      <td className="pl-4 py-2 font-medium flex items-center gap-2">
                        <span>{t.flag}</span> {t.name}
                      </td>
                      <td className="text-center tabular-nums">{row.played}</td>
                      <td className="text-center tabular-nums">{row.gf - row.ga}</td>
                      <td className="text-right pr-4 font-bold tabular-nums">{row.pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Insight({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
