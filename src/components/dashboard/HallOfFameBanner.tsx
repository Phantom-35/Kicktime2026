import { motion } from "framer-motion";
import type { TournamentWinner } from "@/hooks/useTournamentWinner";

export function HallOfFameBanner({ winner }: { winner: TournamentWinner }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="relative mb-4 overflow-hidden rounded-2xl border border-yellow-400/40 bg-gradient-to-br from-yellow-500/20 via-amber-400/10 to-yellow-600/20 px-4 py-4 shadow-[0_8px_28px_-12px_rgba(251,191,36,0.55)]"
    >
      {/* Animated shine */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, rgba(255,215,120,0.25) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["200% 0%", "-100% 0%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative flex items-center gap-3">
        <div className="text-4xl leading-none" aria-hidden>
          {winner.team.flag}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black tracking-tight text-yellow-100 truncate">
            👑 Weltmeister 2026: {winner.team.name}
          </p>
          <p className="mt-0.5 text-[11px] text-yellow-200/70">
            Danke für die Nutzung von KickTime!
          </p>
        </div>
      </div>
    </motion.div>
  );
}
