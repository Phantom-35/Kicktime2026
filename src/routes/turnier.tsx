import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { computeTeamStatuses, labelForRound, type EliminatedRound, type TeamStatus } from "@/lib/tournament-status";
import { Trophy, X } from "lucide-react";

const TeamDetailSheet = lazy(() => import("@/components/team/TeamDetailSheet"));

export const Route = createFileRoute("/turnier")({
  head: () => ({
    meta: [
      { title: "K.-o.-Baum & Turnier-Status der WM 2026 — KickTime" },
      { name: "description", content: "K.-o.-Baum der FIFA WM 2026 vom Sechzehntelfinale bis zum Finale plus Live-Status jedes Teams — wer ist noch dabei, wer ausgeschieden?" },
      { property: "og:title", content: "WM 2026 K.-o.-Baum & Team-Status" },
      { property: "og:description", content: "K.-o.-Runden und Team-Status der FIFA WM 2026 – live aktualisiert." },
      { property: "og:url", content: "https://kicktime-planer.lovable.app/turnier" },
    ],
    links: [{ rel: "canonical", href: "https://kicktime-planer.lovable.app/turnier" }],
  }),
  component: TurnierPage,
});

const ELIM_SORT: Record<EliminatedRound, number> = {
  final: 0, third: 1, sf: 2, qf: 3, r16: 4, r32: 5, group: 6,
};

function TurnierPage() {
  const matches = useMatchStore(selectMatchList);
  const statuses = useMemo(() => computeTeamStatuses(matches), [matches]);
  const alive = useMemo(
    () => statuses.filter((s) => s.alive).sort((a, b) => a.team.name.localeCompare(b.team.name, "de")),
    [statuses]
  );
  const eliminated = useMemo(
    () =>
      statuses
        .filter((s) => !s.alive && s.eliminatedIn)
        .sort((a, b) => {
          const r = ELIM_SORT[a.eliminatedIn!] - ELIM_SORT[b.eliminatedIn!];
          return r !== 0 ? r : a.team.name.localeCompare(b.team.name, "de");
        }),
    [statuses]
  );
  const [selected, setSelected] = useState<TeamStatus | null>(null);

  return (
    <div className="px-4 py-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" /> Turnier-Status
        </h1>
        <p className="text-sm text-muted-foreground">
          Wer ist bei der WM 2026 noch im Rennen — und wer ist bereits raus?
        </p>
      </header>

      <section aria-labelledby="alive-heading" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 id="alive-heading" className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-emerald-500" /> Noch im Rennen
          </h2>
          <span className="text-xs font-bold tabular-nums text-emerald-500">{alive.length}</span>
        </div>
        <ul className="grid grid-cols-2 gap-2">
          {alive.map((s) => (
            <li key={s.team.code}>
              <button
                type="button"
                onClick={() => setSelected(s)}
                className="w-full flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-left hover:border-emerald-400/60 hover:bg-emerald-500/10 active:scale-[0.98] transition"
              >
                <span className="text-lg leading-none">{s.team.flag}</span>
                <span className="text-sm font-medium truncate">{s.team.name}</span>
              </button>
            </li>
          ))}
          {alive.length === 0 && (
            <li className="col-span-2 text-sm text-muted-foreground italic">Keine Teams mehr — Turnier vorbei.</li>
          )}
        </ul>
      </section>

      <section aria-labelledby="out-heading" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 id="out-heading" className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <X className="h-3.5 w-3.5 text-destructive" /> Ausgeschieden
          </h2>
          <span className="text-xs font-bold tabular-nums text-destructive">{eliminated.length}</span>
        </div>
        <ul className="space-y-1.5">
          {eliminated.map((s) => (
            <li key={s.team.code}>
              <button
                type="button"
                onClick={() => setSelected(s)}
                className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 opacity-80 hover:opacity-100 hover:border-primary/40 active:scale-[0.98] transition text-left"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-lg leading-none grayscale">{s.team.flag}</span>
                  <span className="text-sm font-medium truncate">{s.team.name}</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                  {labelForRound(s.eliminatedIn!)}
                </span>
              </button>
            </li>
          ))}
          {eliminated.length === 0 && (
            <li className="text-sm text-muted-foreground italic">Noch niemand ausgeschieden.</li>
          )}
        </ul>
      </section>

      <Suspense fallback={null}>
        <TeamDetailSheet
          open={!!selected}
          onOpenChange={(v) => !v && setSelected(null)}
          team={selected?.team ?? null}
          alive={selected?.alive ?? true}
          eliminatedIn={selected?.eliminatedIn}
        />
      </Suspense>
    </div>
  );
}
