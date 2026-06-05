import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { getLocalParts } from "@/lib/time";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function TournamentCountdown() {
  const matches = useMatchStore(selectMatchList);
  const favoriteTeams = useAppStore((s) => s.favoriteTeams);
  const setShowCountdown = useAppStore((s) => s.setShowCountdown);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const tournamentStart = useMemo(() => {
    let min = Infinity;
    for (const m of matches) {
      const t = new Date(m.utcTimestamp).getTime();
      if (t < min) min = t;
    }
    return Number.isFinite(min) ? min : 0;
  }, [matches]);

  const target = useMemo(() => {
    if (now < tournamentStart) {
      return {
        mode: "pre" as const,
        ts: tournamentStart,
        label: "🏆 Das größte Turnier der Welt startet in",
      };
    }
    const upcoming = matches
      .filter((m) => m.status !== "finished" && new Date(m.utcTimestamp).getTime() > now)
      .sort((a, b) => new Date(a.utcTimestamp).getTime() - new Date(b.utcTimestamp).getTime());

    const fav = upcoming.find(
      (m) => favoriteTeams.includes(m.teamA) || favoriteTeams.includes(m.teamB)
    );
    if (fav) {
      return {
        mode: "fav" as const,
        ts: new Date(fav.utcTimestamp).getTime(),
        label: `🔥 Dein nächstes Top-Match: ${fav.teamA} vs. ${fav.teamB} in`,
      };
    }
    const todayKey = getLocalParts(new Date(now).toISOString()).dayKey;
    const next = upcoming.find(
      (m) => getLocalParts(m.utcTimestamp).dayKey === todayKey
    );
    if (next) {
      return {
        mode: "next" as const,
        ts: new Date(next.utcTimestamp).getTime(),
        label: `⏱️ Nächstes Spiel heute: ${next.teamA} vs. ${next.teamB} in`,
      };
    }
    return null;
  }, [now, matches, favoriteTeams, tournamentStart]);

  if (!target) return null;

  const diff = Math.max(0, target.ts - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="relative mb-4 overflow-hidden rounded-2xl border border-primary/25 bg-card/60 backdrop-blur-md px-4 py-3 shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.35)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />

      <button
        type="button"
        aria-label="Countdown ausblenden"
        onClick={() => setShowCountdown(false)}
        className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/40 text-muted-foreground hover:bg-background/70 hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="relative">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground pr-7 leading-snug">
          {target.label}
        </p>
        <div className="mt-2 flex items-end gap-3">
          <Segment value={days} unit="Tage" />
          <Separator />
          <Segment value={hours} unit="Std" pad2 />
          <Separator />
          <Segment value={minutes} unit="Min" pad2 />
          <Separator />
          <Segment value={seconds} unit="Sek" pad2 />
        </div>
      </div>
    </motion.div>
  );
}

function Segment({ value, unit, pad2 }: { value: number; unit: string; pad2?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono tabular-nums text-2xl font-bold tracking-tight text-foreground min-w-[2.5ch] text-center leading-none">
        {pad2 ? pad(value) : value}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {unit}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span className="font-mono text-2xl font-bold text-primary/40 leading-none pb-[18px]">·</span>
  );
}
