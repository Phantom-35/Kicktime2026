import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { TEAMS, getTeam } from "@/data/teams";
import {
  calculateTableStandings,
  GROUP_LETTERS,
  type LiveScores,
} from "@/lib/standings";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchDetailSheet } from "@/components/match/MatchDetailSheet";
import { Button } from "@/components/ui/button";
import { addMatchToCalendar } from "@/lib/calendar";
import { getLocalParts } from "@/lib/time";
import type { RuntimeMatch } from "@/store/match-store";


export const Route = createFileRoute("/tabellen")({ component: TabellenPage });

function TabellenPage() {
  const matches = useMatchStore(selectMatchList);
  const now = useMatchStore((s) => s.now);
  const [activeGroup, setActiveGroup] = useState<string>("E");
  const [selected, setSelected] = useState<RuntimeMatch | null>(null);

  const live: LiveScores = useMemo(() => {
    const out: LiveScores = {};
    for (const m of matches) if (m.status === "live" && m.liveScore) out[m.id] = m.liveScore;
    return out;
  }, [matches]);

  const liveMatchesForGroup = useMemo(
    () => matches.filter((m) => m.group === activeGroup && m.status === "live"),
    [activeGroup, matches]
  );

  const standings = useMemo(
    () => calculateTableStandings(activeGroup, matches, live),
    [activeGroup, matches, live]
  );

  const upcomingForGroup = useMemo(() => {
    const reference = now ?? Date.now();
    return matches
      .filter(
        (m) =>
          m.group === activeGroup &&
          m.stage === "group" &&
          (m.status === "live" ||
            new Date(m.utcTimestamp).getTime() >= reference)
      )
      .sort((a, b) => {
        if (a.status === "live" && b.status !== "live") return -1;
        if (b.status === "live" && a.status !== "live") return 1;
        return (
          new Date(a.utcTimestamp).getTime() -
          new Date(b.utcTimestamp).getTime()
        );
      })
      .slice(0, 2);
  }, [matches, activeGroup, now]);

  return (

    <div className="p-4 pb-24 relative">
      <h2 className="text-xl font-bold mb-1">Tabellen</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Gruppenphase WM 2026 — Live-Updates
      </p>

      {/* Group pill selector */}
      <div className="-mx-4 px-4 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
          {GROUP_LETTERS.map((g) => {
            const active = g === activeGroup;
            return (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`shrink-0 snap-start rounded-full px-4 h-9 text-sm font-semibold transition-all active:scale-95 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                Gruppe {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live banner */}
      {liveMatchesForGroup.length > 0 && (
        <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-destructive">
              Live in Gruppe {activeGroup}
            </span>
          </div>
          <div className="space-y-1.5">
            {liveMatchesForGroup.map((m) => {
              const s = live[m.id]!;
              return (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    {getTeam(m.teamA).flag} {getTeam(m.teamA).name}
                    <span className="text-muted-foreground"> vs </span>
                    {getTeam(m.teamB).flag} {getTeam(m.teamB).name}
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    {s.a}:{s.b}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standings table */}
      <GroupCard group={activeGroup} standings={standings} />

      {/* Next matches in this group */}
      <section className="mt-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Nächste Spiele dieser Gruppe
        </h3>
        {upcomingForGroup.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Die Gruppenphase für diese Gruppe ist beendet. Die Top 2 stehen in
            der K.-o.-Runde.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingForGroup.map((m) => (
              <MatchCard key={m.id} match={m} onClick={() => setSelected(m)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-[11px] text-muted-foreground hover:bg-muted/50 hover:text-foreground mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      addMatchToCalendar(m);
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
              </MatchCard>
            ))}
          </div>
        )}
      </section>

      <MatchDetailSheet
        match={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  );
}


function GroupCard({
  group,
  standings,
}: {
  group: string;
  standings: ReturnType<typeof calculateTableStandings>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-bold">Gruppe {group}</h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Top 2 qualifiziert
        </span>
      </div>
      <div className="px-4 py-2 grid grid-cols-[1.5rem_1fr_2rem_2.5rem_2.5rem] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
        <span>#</span>
        <span>Team</span>
        <span className="text-right">SP</span>
        <span className="text-right">TD</span>
        <span className="text-right">PKT</span>
      </div>
      <ul className="relative">
        <AnimatePresence initial={false}>
          {standings.map((row, idx) => {
            const team = TEAMS.find((t) => t.code === row.code)!;
            const qualified = idx < 2;
            return (
              <motion.li
                key={row.code}
                layout
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className={`grid grid-cols-[1.5rem_1fr_2rem_2.5rem_2.5rem] gap-2 items-center px-4 py-3 text-sm border-b border-border/40 last:border-0 ${
                  qualified ? "bg-primary/5" : ""
                }`}
              >
                <span className="flex items-center">
                  {qualified && (
                    <span className="h-5 w-1 rounded-full bg-primary mr-1.5" />
                  )}
                  <span
                    className={`text-xs font-bold ${
                      qualified ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </span>
                </span>
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none">{team.flag}</span>
                  <span className="truncate font-medium">{team.name}</span>
                </span>
                <span className="text-right tabular-nums text-muted-foreground">
                  {row.played}
                </span>
                <span
                  className={`text-right tabular-nums ${
                    row.gd > 0
                      ? "text-primary"
                      : row.gd < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </span>
                <motion.span
                  key={row.pts}
                  initial={{ scale: 1.3, color: "var(--accent)" }}
                  animate={{ scale: 1, color: "var(--foreground)" }}
                  transition={{ duration: 0.4 }}
                  className="text-right tabular-nums font-bold"
                >
                  {row.pts}
                </motion.span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
