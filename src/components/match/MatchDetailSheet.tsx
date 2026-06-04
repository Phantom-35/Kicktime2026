import { useMemo, useState } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { Match } from "@/data/matches";
import { getTeam } from "@/data/teams";
import { calculateTableStandings, type LiveScores } from "@/lib/standings";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { getLocalParts } from "@/lib/time";
import { hasAnyFreeTv, hasMagentaTv } from "@/lib/broadcaster";
import { Tv, MapPin, History } from "lucide-react";


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
  const allMatches = useMatchStore(selectMatchList);

  const history = useMemo(() => {
    if (!match) return [];
    return allMatches
      .filter(
        (m) =>
          m.group === match.group &&
          m.status === "finished" &&
          m.id !== match.id &&
          (m.teamA === match.teamA || m.teamB === match.teamA) &&
          m.score
      )
      .sort(
        (a, b) =>
          new Date(a.utcTimestamp).getTime() - new Date(b.utcTimestamp).getTime()
      );
  }, [match, allMatches]);

  if (!match) return null;
  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);
  const local = getLocalParts(match.utcTimestamp, tz);
  const liveScores: LiveScores = {};
  for (const m of allMatches) {
    if (m.status === "live" && m.liveScore) liveScores[m.id] = m.liveScore;
  }
  const standings =
    match.stage === "group"
      ? calculateTableStandings(match.group, allMatches, liveScores)
      : [];
  const hideFinishedScore = spoiler && match.status === "finished" && !revealed;
  const showFreeTv = hasAnyFreeTv(match);
  const showMagenta = hasMagentaTv(match);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[90vh] border-border bg-background focus-visible:outline-none">
        {/* Drag handle area – vaul listens for drag gestures on the content; the inner scroll container below still scrolls normally */}
        <DrawerHeader className="text-left pb-2 pt-3 cursor-grab active:cursor-grabbing">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-muted" />
          <DrawerTitle className="flex items-center gap-2">
            <span className="text-2xl">{a.flag}</span>
            <span>{a.name}</span>
            <span className="text-muted-foreground mx-1">vs</span>
            <span className="text-2xl">{b.flag}</span>
            <span>{b.name}</span>
          </DrawerTitle>
          <p className="text-xs text-muted-foreground">{local.fullStr} · Gruppe {match.group}</p>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto space-y-5">

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

          {/* Broadcaster — ARD + ZDF combined in free TV, MagentaTV separate & larger */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Tv className="h-3.5 w-3.5" /> Live im TV
            </div>
            <div className="flex flex-col gap-3 w-full">
              {showFreeTv && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Free-TV: ARD oder ZDF
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getBroadcasterUrl("ARD"), "_blank", "noopener,noreferrer")}
                      className="h-8 flex-1 text-xs font-medium"
                    >
                      ARD öffnen
                    </Button>
                    <span className="text-[10px] uppercase text-muted-foreground">oder</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getBroadcasterUrl("ZDF"), "_blank", "noopener,noreferrer")}
                      className="h-8 flex-1 text-xs font-medium"
                    >
                      ZDF öffnen
                    </Button>
                  </div>
                </div>
              )}
              {showMagenta && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pay-TV</span>
                  <Button
                    variant="default"
                    onClick={() => window.open(getBroadcasterUrl("MagentaTV"), "_blank", "noopener,noreferrer")}
                    className="h-12 w-full text-base font-semibold"
                  >
                    MagentaTV öffnen
                  </Button>
                </div>
              )}

              {!showFreeTv && !showMagenta && (
                <p className="text-xs text-muted-foreground">Keine Übertragung hinterlegt.</p>
              )}
            </div>
          </div>

          {/* Stadium */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground">
              <MapPin className="h-4 w-4" /> Stadion
            </div>
            <div className="mt-1 text-sm font-semibold">{match.stadium}, {match.city}</div>
          </div>

          {/* Team A history in this group (only for group stage) */}
          {match.stage === "group" && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <History className="h-3.5 w-3.5" /> Bilanz {a.name} in Gruppe {match.group}
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Noch keine Gruppenspiele absolviert.</p>
              ) : (
                <ul className="space-y-1.5">
                  {history.map((m) => {
                    const isHome = m.teamA === match.teamA;
                    const opp = getTeam(isHome ? m.teamB : m.teamA);
                    const gf = isHome ? m.score!.a : m.score!.b;
                    const ga = isHome ? m.score!.b : m.score!.a;
                    const tone =
                      gf > ga ? "text-primary" : gf < ga ? "text-destructive" : "text-muted-foreground";
                    const hideThis = spoiler && !revealed;
                    return (
                      <li key={m.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{opp.flag}</span>
                          <span className="truncate">{opp.name}</span>
                        </span>
                        <span className={`font-bold tabular-nums ${tone} ${hideThis ? "blur-sm select-none" : ""}`}>
                          {gf} : {ga}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Standings (only meaningful for group-stage matches) */}
          {match.stage === "group" && standings.length > 0 && (
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
                        <td className="text-center tabular-nums">{row.gd}</td>
                        <td className="text-right pr-4 font-bold tabular-nums">{row.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
