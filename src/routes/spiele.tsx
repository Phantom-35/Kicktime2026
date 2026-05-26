import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { Match } from "@/data/matches";
import { isPerfectFor, isNightShift } from "@/lib/categorize";
import { getTeam } from "@/data/teams";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { getLocalParts } from "@/lib/time";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchDetailSheet } from "@/components/match/MatchDetailSheet";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/spiele")({ component: SpielePage });

function SpielePage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Match | null>(null);
  const state = useAppStore();
  const matches = useMatchStore(selectMatchList);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = ql
      ? matches.filter((m) => {
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
    const map = new Map<string, Match[]>();
    for (const m of filtered) {
      const day = getLocalParts(m.utcTimestamp, state.userTimezone).dayStr;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(m);
    }
    return Array.from(map.entries());
  }, [filtered, state.userTimezone]);

  return (
    <div className="p-4 pb-6">
      <h2 className="text-xl font-bold mb-3">Alle Spiele</h2>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Team oder Stadt suchen…"
          className="pl-9 h-11 bg-card"
        />
      </div>

      <div className="space-y-5">
        {grouped.map(([day, list]) => (
          <div key={day}>
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">{day}</div>
            <div className="space-y-2.5">
              {list.map((m) => {
                const indicator = isPerfectFor(m, state)
                  ? "perfect"
                  : isNightShift(m, state)
                  ? "night"
                  : null;
                return (
                  <MatchCard
                    key={m.id}
                    match={m}
                    indicator={indicator}
                    onClick={() => setSelected(m)}
                  />
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
