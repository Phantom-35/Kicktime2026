import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, BarChart3, Users, Shield, Globe2, Calendar, UserCog } from "lucide-react";
import type { Team } from "@/data/teams";
import { getTeamSquad, type TeamSquad, type Position } from "@/data/squads";
import { labelForRound, type EliminatedRound } from "@/lib/tournament-status";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  team: Team | null;
  alive: boolean;
  eliminatedIn?: EliminatedRound;
};

const POSITIONS: Position[] = ["Torwart", "Abwehr", "Mittelfeld", "Sturm"];
const POS_SHORT: Record<Position, string> = {
  Torwart: "TW", Abwehr: "ABW", Mittelfeld: "MF", Sturm: "ST",
};

export default function TeamDetailSheet({ open, onOpenChange, team, alive, eliminatedIn }: Props) {
  const [squad, setSquad] = useState<TeamSquad | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !team) return;
    let cancelled = false;
    setSquad(null);
    setLoading(true);
    getTeamSquad(team.code).then((s) => {
      if (!cancelled) {
        setSquad(s);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [open, team]);

  if (!team) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t-2 border-primary/30 bg-card/95 backdrop-blur-xl max-h-[88vh] overflow-y-auto p-0"
      >
        {/* Header */}
        <SheetHeader className="p-5 pb-3 space-y-3 text-left">
          <div className="flex items-center gap-4">
            <div className="text-6xl leading-none drop-shadow-[0_0_18px_hsl(var(--primary)/0.35)]">
              {team.flag}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-2xl font-black tracking-tight truncate">
                {team.name}
              </SheetTitle>
              <div className="mt-1.5">
                {alive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
                    <Trophy className="h-3 w-3" /> Noch im Rennen
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/40">
                    Aus – {eliminatedIn ? labelForRound(eliminatedIn) : "—"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Prominente Badges */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 shadow-[0_0_20px_-8px_hsl(var(--primary)/0.5)]">
              <Trophy className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">WM-Titel</div>
                <div className="text-lg font-black leading-tight tabular-nums">
                  {squad?.wmTitel ?? (loading ? "…" : "—")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 shadow-[0_0_20px_-8px_hsl(var(--primary)/0.5)]">
              <BarChart3 className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">FIFA-Rang</div>
                <div className="text-lg font-black leading-tight tabular-nums">
                  {squad ? `#${squad.fifaWeltranglistenplatz}` : loading ? "…" : "—"}
                </div>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Basis-Info-Grid */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <InfoTile icon={<UserCog className="h-4 w-4" />} label="Trainer" value={squad?.trainer} loading={loading} />
            <InfoTile icon={<Globe2 className="h-4 w-4" />} label="Verband" value={squad?.kontinentalverband} loading={loading} />
            <InfoTile icon={<Calendar className="h-4 w-4" />} label="Gegründet" value={squad?.verbandGegruendet?.toString()} loading={loading} />
            <InfoTile
              icon={<Users className="h-4 w-4" />}
              label="Kadergröße"
              value={squad ? String(POSITIONS.reduce((s, p) => s + squad.kader[p].length, 0)) : undefined}
              loading={loading}
            />
          </div>
        </div>

        {/* Kader */}
        <div className="px-5 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Kader</h3>
          </div>

          {squad ? (
            <Tabs defaultValue="Torwart" className="w-full">
              <TabsList className="grid grid-cols-4 w-full h-auto">
                {POSITIONS.map((pos) => (
                  <TabsTrigger key={pos} value={pos} className="flex flex-col gap-0.5 py-1.5">
                    <span className="text-[10px] font-bold tracking-wider">{POS_SHORT[pos]}</span>
                    <span className="text-[9px] opacity-70 tabular-nums">{squad.kader[pos].length}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {POSITIONS.map((pos) => (
                <TabsContent key={pos} value={pos} className="mt-3">
                  {squad.kader[pos].length === 0 ? (
                    <p className="text-xs text-muted-foreground italic px-1">Keine Spieler in dieser Position.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {squad.kader[pos].map((p, i) => (
                        <li
                          key={p.name}
                          className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                        >
                          <span className="text-[10px] font-bold tabular-nums text-muted-foreground w-5 text-right">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium truncate">{p.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : loading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-background/40 border border-border/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Kader-Infos nicht verfügbar.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoTile({
  icon, label, value, loading,
}: { icon: React.ReactNode; label: string; value?: string; loading: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold truncate">
        {value ?? (loading ? "…" : "—")}
      </div>
    </div>
  );
}
