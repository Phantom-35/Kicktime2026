import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { Match } from "@/data/matches";
import { isPerfectFor, isNightShift } from "@/lib/categorize";
import { getTeam } from "@/data/teams";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { getLocalParts, parseDateQuery, matchesDateQuery } from "@/lib/time";
import { addMatchToCalendar } from "@/lib/calendar";
import { haptics } from "@/lib/haptics";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchDetailSheet } from "@/components/match/MatchDetailSheet";
import { AlarmBell } from "@/components/match/AlarmBell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CalendarPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/spiele")({ component: SpielePage });

function SpielePage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Match | null>(null);
  const state = useAppStore();
  const spoiler = useAppStore((s) => s.spoilerProtection);
  const matches = useMatchStore(selectMatchList);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const dateQ = parseDateQuery(q);
    const list = ql
      ? matches.filter((m) => {
          if (dateQ && matchesDateQuery(m.utcTimestamp, dateQ)) return true;
          const a = getTeam(m.teamA).name.toLowerCase();
          const b = getTeam(m.teamB).name.toLowerCase();
          return a.includes(ql) || b.includes(ql) || m.city.toLowerCase().includes(ql);
        })
      : matches;
    return [...list].sort(
      (a, b) => new Date(a.utcTimestamp).getTime() - new Date(b.utcTimestamp).getTime()
    );
  }, [q, matches]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; list: Match[] }>();
    for (const m of filtered) {
      const parts = getLocalParts(m.utcTimestamp);
      const key = parts.dayKey;
      if (!map.has(key)) map.set(key, { label: parts.dayStr, list: [] });
      map.get(key)!.list.push(m);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, v]) => [key, v.label, v.list] as const);
  }, [filtered]);

  return (
    <div className="p-4 pb-6 relative">
      <h2 className="text-xl font-bold mb-3">Alle Spiele</h2>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Team, Stadt oder Datum (z. B. 14.06)…"
          className="pl-9 h-11 bg-card"
        />
      </div>

      <div className="space-y-5">
        {grouped.map(([key, label, list]) => (
          <div key={key}>
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">{label}</div>
            <div className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-3">
              {list.map((m) => {
                const indicator = isPerfectFor(m, state)
                  ? "perfect"
                  : isNightShift(m, state)
                  ? "night"
                  : null;
                return (
                  <div key={m.id}>
                    <MatchCard
                      match={m}
                      indicator={indicator}
                      hideScore={spoiler && m.status === "finished"}
                      onClick={() => setSelected(m)}
                    >
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-7 text-[11px] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            try {
                              addMatchToCalendar(m);
                              haptics.tap();
                              toast.success("Kalender wird geöffnet…", {
                                description: getLocalParts(m.utcTimestamp).fullStr,
                              });
                            } catch {
                              toast.error("Konnte Kalender nicht öffnen");
                            }
                          }}
                        >
                          <CalendarPlus className="h-3 w-3 mr-1" /> Zum Kalender hinzufügen
                        </Button>
                        <AlarmBell match={m} />
                      </div>
                    </MatchCard>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Spiele gefunden.
          </p>
        )}
      </div>

      <MatchDetailSheet match={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />

    </div>
  );
}
