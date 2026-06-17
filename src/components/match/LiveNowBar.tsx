import { useState } from "react";
import { useMatchStore, selectMatchList, type RuntimeMatch } from "@/store/match-store";
import { getTeam } from "@/data/teams";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Radio } from "lucide-react";

export function LiveNowBar({ onOpenMatch }: { onOpenMatch: (m: RuntimeMatch) => void }) {
  const matches = useMatchStore(selectMatchList);
  const live = matches.filter((m) => m.status === "live");
  const [listOpen, setListOpen] = useState(false);

  if (live.length === 0) return null;

  const handleClick = () => {
    if (live.length === 1) onOpenMatch(live[0]);
    else setListOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full mb-4 flex items-center gap-2 rounded-xl border-2 border-destructive/60 bg-destructive/10 px-3 py-2 text-left active:scale-[0.99] transition-transform"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-destructive shrink-0">
          Jetzt live
        </span>
        <span className="text-xs text-foreground truncate flex-1">
          {live.length === 1
            ? `${getTeam(live[0].teamA).flag} ${getTeam(live[0].teamA).name} ${live[0].liveScore?.a ?? 0}:${live[0].liveScore?.b ?? 0} ${getTeam(live[0].teamB).name} ${getTeam(live[0].teamB).flag}`
            : `${live.length} Spiele gleichzeitig`}
        </span>
        <Radio className="h-4 w-4 text-destructive shrink-0" />
      </button>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Radio className="h-4 w-4" /> Jetzt live · {live.length} Spiele
            </DialogTitle>
          </DialogHeader>
          <ul className="space-y-2 mt-2">
            {live.map((m) => {
              const a = getTeam(m.teamA);
              const b = getTeam(m.teamB);
              return (
                <li key={m.id}>
                  <button
                    onClick={() => {
                      setListOpen(false);
                      onOpenMatch(m);
                    }}
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-destructive/40 bg-card p-3 hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-lg">{a.flag}</span>
                      <span>{a.name}</span>
                    </span>
                    <span className="text-base font-bold tabular-nums text-destructive">
                      {m.liveScore?.a ?? 0} : {m.liveScore?.b ?? 0}
                    </span>
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span>{b.name}</span>
                      <span className="text-lg">{b.flag}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
