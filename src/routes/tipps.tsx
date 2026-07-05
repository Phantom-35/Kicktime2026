import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { summarize, scorePrediction, RESULT_LABEL } from "@/lib/predictions";
import { MatchDetailSheet } from "@/components/match/MatchDetailSheet";
import { getTeam } from "@/data/teams";
import { getLocalParts } from "@/lib/time";
import { Trophy, Target, Clock } from "lucide-react";
import type { Match } from "@/data/matches";

export const Route = createFileRoute("/tipps")({
  head: () => ({
    meta: [
      { title: "WM-2026-Tipprunde — deine Vorhersagen | KickTime" },
      { name: "description", content: "Tippe die Ergebnisse der FIFA WM 2026, behalte deine Trefferquote im Blick und vergleiche deine offenen und abgeschlossenen Tipps." },
      { property: "og:title", content: "WM-2026-Tipprunde — deine Vorhersagen" },
      { property: "og:description", content: "Tippe FIFA-WM-2026-Ergebnisse und verfolge deine Trefferquote in einer persönlichen Tipprunde." },
      { property: "og:url", content: "https://kicktime-planer.lovable.app/tipps" },
    ],
    links: [{ rel: "canonical", href: "https://kicktime-planer.lovable.app/tipps" }],
  }),
  component: TippsPage,
});

function TippsPage() {
  const predictions = useAppStore((s) => s.predictions);
  const allMatches = useMatchStore(selectMatchList);
  const [selected, setSelected] = useState<Match | null>(null);

  const summary = useMemo(() => summarize(predictions, allMatches), [predictions, allMatches]);

  const open = useMemo(() => {
    return Object.keys(predictions)
      .map((id) => allMatches.find((m) => m.id === id))
      .filter((m): m is Match => !!m && m.status !== "finished")
      .sort(
        (a, b) =>
          new Date(a.utcTimestamp).getTime() - new Date(b.utcTimestamp).getTime()
      );
  }, [predictions, allMatches]);

  const rated = useMemo(() => {
    return Object.keys(predictions)
      .map((id) => allMatches.find((m) => m.id === id))
      .filter((m): m is Match => !!m && m.status === "finished" && !!m.score)
      .sort(
        (a, b) =>
          new Date(b.utcTimestamp).getTime() - new Date(a.utcTimestamp).getTime()
      );
  }, [predictions, allMatches]);

  return (
    <div className="p-4 pb-6 space-y-5">
      <header className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Tipprunden zur FIFA WM 2026</h1>
      </header>

      {/* Stat card */}
      <div className="rounded-2xl border border-primary/25 bg-card/70 backdrop-blur p-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Punkte" value={summary.points} accent />
          <Stat label="Trefferquote" value={`${Math.round(summary.hitRate * 100)}%`} />
          <Stat label="Bewertet" value={`${summary.rated}/${summary.total}`} />
        </div>

        <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-muted/40">
          <BarSeg value={summary.exact} total={summary.rated} className="bg-primary" />
          <BarSeg value={summary.diff} total={summary.rated} className="bg-accent" />
          <BarSeg value={summary.tendency} total={summary.rated} className="bg-yellow-500/70" />
          <BarSeg value={summary.miss} total={summary.rated} className="bg-destructive/70" />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Legend dot="bg-primary" label="Volltreffer" value={summary.exact} />
          <Legend dot="bg-accent" label="Differenz" value={summary.diff} />
          <Legend dot="bg-yellow-500/70" label="Tendenz" value={summary.tendency} />
          <Legend dot="bg-destructive/70" label="Daneben" value={summary.miss} />
        </div>
      </div>

      {/* Open */}
      <section>
        <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-muted-foreground" /> Offene Tipps
          <span className="text-xs font-normal text-muted-foreground">({open.length})</span>
        </h3>
        {open.length === 0 ? (
          <EmptyHint text="Keine offenen Tipps. Tippe Spiele in der Detailansicht." />
        ) : (
          <ul className="space-y-2">
            {open.map((m) => {
              const a = getTeam(m.teamA);
              const b = getTeam(m.teamB);
              const p = predictions[m.id];
              const local = getLocalParts(m.utcTimestamp);
              return (
                <li key={m.id}>
                  <button
                    onClick={() => setSelected(m)}
                    className="w-full text-left rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">
                          {a.flag} {a.name} <span className="text-muted-foreground">vs</span> {b.flag} {b.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{local.fullStr}</div>
                      </div>
                      <div className="shrink-0 rounded-lg bg-primary/15 text-primary px-2.5 py-1 font-bold tabular-nums text-sm">
                        {p.a} : {p.b}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Rated */}
      <section>
        <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-muted-foreground" /> Bewertete Tipps
          <span className="text-xs font-normal text-muted-foreground">({rated.length})</span>
        </h3>
        {rated.length === 0 ? (
          <EmptyHint text="Noch keine Spiele mit deinem Tipp beendet." />
        ) : (
          <ul className="space-y-2">
            {rated.map((m) => {
              const a = getTeam(m.teamA);
              const b = getTeam(m.teamB);
              const p = predictions[m.id];
              const r = scorePrediction(p, m.score!);
              const tone =
                r.result === "exact"
                  ? "border-primary/60 bg-primary/10"
                  : r.result === "diff"
                  ? "border-accent/60 bg-accent/10"
                  : r.result === "tendency"
                  ? "border-yellow-500/40 bg-yellow-500/5"
                  : "border-border bg-card";
              return (
                <li key={m.id}>
                  <button
                    onClick={() => setSelected(m)}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${tone}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">
                          {a.flag} {a.name} <span className="text-muted-foreground">vs</span> {b.flag} {b.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span>Tipp <span className="tabular-nums font-semibold">{p.a}:{p.b}</span></span>
                          <span>·</span>
                          <span>Endstand <span className="tabular-nums font-semibold">{m.score!.a}:{m.score!.b}</span></span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {RESULT_LABEL[r.result]}
                        </div>
                        <div className="font-bold tabular-nums text-sm">
                          +{r.points}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
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

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-black tabular-nums ${accent ? "text-primary" : ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function BarSeg({ value, total, className }: { value: number; total: number; className: string }) {
  if (total === 0 || value === 0) return null;
  const pct = (value / total) * 100;
  return <div style={{ width: `${pct}%` }} className={className} />;
}

function Legend({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1 truncate">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="truncate">{label}</span>
      <span className="ml-auto tabular-nums">{value}</span>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}
