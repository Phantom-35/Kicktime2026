import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Match } from "@/data/matches";
import { isPerfectFor, isNightShift } from "@/lib/categorize";
import { getTeam } from "@/data/teams";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { getLocalParts } from "@/lib/time";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchDetailSheet } from "@/components/match/MatchDetailSheet";
import { Input } from "@/components/ui/input";
import { Search, ArrowUp } from "lucide-react";

export const Route = createFileRoute("/spiele")({ component: SpielePage });

function getScroller(): HTMLElement | null {
  let el: HTMLElement | null = document.querySelector("main");
  while (el) {
    const style = window.getComputedStyle(el);
    if (/(auto|scroll)/.test(style.overflowY)) return el;
    el = el.parentElement;
  }
  return null;
}

function SpielePage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Match | null>(null);
  const [showTop, setShowTop] = useState(false);
  const state = useAppStore();
  const spoiler = useAppStore((s) => s.spoilerProtection);
  const matches = useMatchStore(selectMatchList);

  useEffect(() => {
    const scroller = getScroller();
    const getY = () => (scroller ? scroller.scrollTop : window.scrollY);
    const onScroll = () => setShowTop(getY() > 120);
    onScroll();
    const target: HTMLElement | Window = scroller ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const scroller = getScroller();
    (scroller ?? window).scrollTo({ top: 0, behavior: "smooth" });
  };

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
          placeholder="Team oder Stadt suchen…"
          className="pl-9 h-11 bg-card"
        />
      </div>

      <div className="space-y-5">
        {grouped.map(([key, label, list]) => (
          <div key={key}>
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">{label}</div>
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
                    hideScore={spoiler && m.status === "finished"}
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

      {showTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Nach oben"
          className="fixed bottom-24 right-5 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
