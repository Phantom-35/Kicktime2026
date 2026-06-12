import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { getTeam } from "@/data/teams";
import { getLocalParts } from "@/lib/time";
import { toast } from "sonner";
import { Minus, Plus, Trash2, Zap, Search } from "lucide-react";
import { setMatchOverride, clearMatchOverride } from "@/lib/match-overrides";
import { haptics } from "@/lib/haptics";

type Status = "scheduled" | "live" | "finished";

export function LiveOverridePanel({ pin }: { pin: string }) {
  const matches = useMatchStore(selectMatchList);
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    const now = Date.now();
    return [...matches].sort((a, b) => {
      const aLive = a.status === "live" ? 0 : 1;
      const bLive = b.status === "live" ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      const at = new Date(a.utcTimestamp).getTime();
      const bt = new Date(b.utcTimestamp).getTime();
      const ad = Math.abs(at - now);
      const bd = Math.abs(bt - now);
      return ad - bd;
    });
  }, [matches]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted.slice(0, 30);
    return sorted
      .filter((m) => {
        const ta = getTeam(m.teamA);
        const tb = getTeam(m.teamB);
        return (
          m.teamA.toLowerCase().includes(q) ||
          m.teamB.toLowerCase().includes(q) ||
          ta.name.toLowerCase().includes(q) ||
          tb.name.toLowerCase().includes(q) ||
          m.utcTimestamp.toLowerCase().includes(q)
        );
      })
      .slice(0, 30);
  }, [sorted, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="search"
          placeholder="Team oder Datum suchen…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background/60 text-xs"
        />
      </div>

      <p className="text-[10px] text-muted-foreground">
        Top 30 Treffer. Tippe Werte, dann „Live schalten“.
      </p>

      <ul className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {filtered.map((m) => (
          <OverrideRow key={m.id} matchId={m.id} pin={pin} />
        ))}
        {filtered.length === 0 && (
          <li className="text-xs text-muted-foreground italic">Nichts gefunden.</li>
        )}
      </ul>
    </div>
  );
}

function OverrideRow({ matchId, pin }: { matchId: string; pin: string }) {
  const match = useMatchStore((s) => s.matches[matchId]);
  if (!match) return null;
  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);
  const local = getLocalParts(match.utcTimestamp);

  const initialScoreA = match.liveScore?.a ?? match.score?.a ?? 0;
  const initialScoreB = match.liveScore?.b ?? match.score?.b ?? 0;
  const [scoreA, setScoreA] = useState<number>(initialScoreA);
  const [scoreB, setScoreB] = useState<number>(initialScoreB);
  const [minute, setMinute] = useState<number>(match.matchMinute ?? 0);
  const [status, setStatus] = useState<Status>(match.status as Status);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const res = await setMatchOverride({
      pin,
      matchId,
      scoreA,
      scoreB,
      minute: status === "scheduled" ? null : minute,
      status,
    });
    setBusy(false);
    if (res.ok) {
      haptics.success();
      toast.success("Live geschaltet ⚡", {
        description: `${a.name} ${scoreA} : ${scoreB} ${b.name}`,
      });
    } else {
      toast.error("Fehler", { description: res.error ?? "Konnte nicht speichern" });
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    const res = await clearMatchOverride({ pin, matchId });
    setBusy(false);
    if (res.ok) {
      toast("Override entfernt");
    } else {
      toast.error("Fehler", { description: res.error ?? "Konnte nicht entfernen" });
    }
  };

  return (
    <li className="rounded-xl border border-border bg-background/60 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold min-w-0">
          <span>{a.flag}</span>
          <span className="truncate">{a.name}</span>
          <span className="text-muted-foreground">vs</span>
          <span>{b.flag}</span>
          <span className="truncate">{b.name}</span>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{local.fullStr}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <NumStepper value={scoreA} onChange={setScoreA} max={20} />
        <span className="text-lg font-black text-muted-foreground">:</span>
        <NumStepper value={scoreB} onChange={setScoreB} max={20} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          Min
          <input
            type="number"
            min={0}
            max={120}
            value={minute}
            onChange={(e) => setMinute(Math.max(0, Math.min(120, Number(e.target.value) || 0)))}
            className="flex-1 h-8 rounded-md border border-border bg-background px-2 text-xs tabular-nums"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
        >
          <option value="scheduled">scheduled</option>
          <option value="live">live</option>
          <option value="finished">finished</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 h-9"
          onClick={submit}
          disabled={busy}
        >
          <Zap className="h-3.5 w-3.5 mr-1.5" /> Änderungen live schalten
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-9"
          onClick={remove}
          disabled={busy}
          aria-label="Override entfernen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

function NumStepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="h-8 w-8 rounded-md border border-border bg-background inline-flex items-center justify-center active:scale-95"
        aria-label="Minus"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-7 text-center text-lg font-black tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-8 w-8 rounded-md border border-primary/50 bg-primary/10 text-primary inline-flex items-center justify-center active:scale-95"
        aria-label="Plus"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
