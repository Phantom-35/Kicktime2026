import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Square } from "lucide-react";
import { TEAMS, getTeam } from "@/data/teams";
import {
  calculateTableStandings,
  GROUP_LETTERS,
  type LiveScores,
} from "@/lib/standings";
import { Button } from "@/components/ui/button";
import { useMatchStore, selectMatchList } from "@/store/match-store";

export const Route = createFileRoute("/tabellen")({ component: TabellenPage });

const SIM_MATCH_IDS = ["m4", "m1", "m5", "m6"]; // GER, MEX, NED, ESP

function TabellenPage() {
  const matches = useMatchStore(selectMatchList);
  const applyLiveUpdate = useMatchStore((s) => s.applyLiveUpdate);
  const [activeGroup, setActiveGroup] = useState<string>("E");
  const [simRunning, setSimRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!simRunning) {
      for (const id of SIM_MATCH_IDS) {
        applyLiveUpdate(id, { status: "scheduled", liveScore: undefined, matchMinute: undefined });
      }
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    for (const id of SIM_MATCH_IDS) {
      applyLiveUpdate(id, { status: "live", liveScore: { a: 0, b: 0 }, matchMinute: 1 });
    }
    tickRef.current = window.setInterval(() => setTick((t) => t + 1), 3500);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [simRunning, applyLiveUpdate]);

  useEffect(() => {
    if (!simRunning || tick === 0) return;
    const id = SIM_MATCH_IDS[Math.floor(Math.random() * SIM_MATCH_IDS.length)];
    const m = useMatchStore.getState().matches[id];
    if (!m) return;
    const cur = m.liveScore ?? { a: 0, b: 0 };
    const side: "a" | "b" = Math.random() < 0.5 ? "a" : "b";
    applyLiveUpdate(id, {
      liveScore: { ...cur, [side]: cur[side] + 1 },
      matchMinute: Math.min(90, (m.matchMinute ?? 0) + Math.floor(Math.random() * 12) + 3),
    });
  }, [tick, simRunning, applyLiveUpdate]);

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

      {/* Floating sim button */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20">
        <Button
          onClick={() => setSimRunning((v) => !v)}
          className={`rounded-full shadow-lg h-11 px-5 ${
            simRunning
              ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {simRunning ? (
            <>
              <Square className="h-4 w-4 mr-2 fill-current" />
              Live-Simulation stoppen
            </>
          ) : (
            <>
              <Radio className="h-4 w-4 mr-2" />
              🔴 Live-Simulation starten
            </>
          )}
        </Button>
      </div>
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
