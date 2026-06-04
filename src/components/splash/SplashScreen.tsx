import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoAsset from "@/assets/splash-logo.jpeg.asset.json";

interface SplashScreenProps {
  onDone: () => void;
  duration?: number;
}

export function SplashScreen({ onDone, duration = 3000 }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden"
        >
          {/* Aura layers */}
          <div className="relative flex items-center justify-center">
            <motion.div
              aria-hidden
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute h-72 w-72 rounded-full bg-primary/30 blur-3xl"
            />
            <motion.div
              aria-hidden
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.15, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              className="absolute h-96 w-96 rounded-full bg-primary/20 blur-3xl"
            />

            {/* Logo */}
            <motion.img
              src={logoAsset.url}
              alt="KickTime"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-40 w-40 rounded-3xl object-cover drop-shadow-[0_0_30px_hsl(var(--primary)/0.45)]"
            />
          </div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
            className="mt-10 flex flex-col items-center"
          >
            <h1 className="text-3xl font-bold tracking-[0.3em] text-foreground">
              KICKTIME
            </h1>
            <span className="mt-2 text-sm tracking-[0.5em] text-muted-foreground">
              2026
            </span>
          </motion.div>

          {/* Loading bar */}
          <div className="absolute bottom-16 left-1/2 h-px w-[60%] -translate-x-1/2 overflow-hidden rounded-full bg-primary/15">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: duration / 1000, ease: "easeOut" }}
              className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
