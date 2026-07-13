import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TournamentWinner } from "@/hooks/useTournamentWinner";

const STORAGE_KEY = "kicktime.endgame.celebrated.v1";
const CONFETTI_COLORS = ["#FBBF24", "#F59E0B", "#FCD34D", "#EF4444", "#3B82F6", "#10B981", "#F472B6"];
const CONFETTI_COUNT = 60;

type Piece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  size: number;
};

function makePieces(): Piece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 3.5 + Math.random() * 3,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotate: Math.random() * 720 - 360,
    size: 6 + Math.random() * 8,
  }));
}

export function WinnerCelebrationOverlay({ winner }: { winner: TournamentWinner }) {
  const [open, setOpen] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setPieces(makePieces());
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [winner.teamCode]);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, winner.teamCode);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="endgame-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
          onClick={close}
        >
          {/* Confetti layer */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {pieces.map((p) => (
              <motion.span
                key={p.id}
                initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
                animate={{
                  y: "110vh",
                  x: [0, 20, -20, 10, 0],
                  opacity: [0, 1, 1, 1, 0.9],
                  rotate: p.rotate,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "easeIn",
                  times: [0, 0.15, 0.45, 0.75, 1],
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: `${p.left}%`,
                  width: p.size,
                  height: p.size * 0.4,
                  background: p.color,
                  borderRadius: 2,
                  boxShadow: `0 0 6px ${p.color}66`,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md rounded-3xl border border-yellow-400/40 bg-gradient-to-br from-yellow-500/15 via-background/95 to-amber-600/15 p-8 text-center shadow-[0_20px_60px_-15px_rgba(251,191,36,0.5)]"
          >
            <button
              type="button"
              aria-label="Schließen"
              onClick={close}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              initial={{ rotate: -10, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 shadow-[0_0_40px_rgba(251,191,36,0.6)]"
            >
              <Trophy className="h-14 w-14 text-yellow-950" strokeWidth={2.5} />
            </motion.div>

            <div className="mt-5 text-6xl leading-none" aria-hidden>
              {winner.team.flag}
            </div>

            <h2 className="mt-5 text-2xl font-black tracking-tight text-yellow-300">
              🏆 {winner.team.name.toUpperCase()}
            </h2>
            <p className="mt-1 text-lg font-bold text-foreground">
              IST WELTMEISTER 2026!
            </p>
            <p className="mt-2 text-base font-semibold text-yellow-200/90">
              Herzlichen Glückwunsch!
            </p>

            <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
              Danke, dass du KickTime 2026 für deine WM-Planung und Turnier-Begleitung genutzt hast! ❤️
            </p>

            <Button
              onClick={close}
              className="mt-6 w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-yellow-950 font-bold hover:from-yellow-400 hover:to-amber-500"
            >
              Schließen
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
