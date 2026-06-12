import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { haptics } from "@/lib/haptics";

const PIN = "031011";

export function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (value.length !== 6) return;
    if (value === PIN) {
      haptics.success();
      onUnlock();
    } else {
      haptics.warn();
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setValue("");
        inputRef.current?.focus();
      }, 350);
    }
  }, [value, onUnlock]);

  return (
    <div className="py-6 flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold">Admin-Bereich gesperrt</div>
        <p className="text-xs text-muted-foreground mt-1">
          Bitte 6-stelligen PIN eingeben.
        </p>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={6}
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="sr-only"
          aria-label="PIN"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className={`flex gap-1.5 ${shake ? "animate-[shake_0.35s_ease-in-out]" : ""}`}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const filled = value.length > i;
            return (
              <span
                key={i}
                className={`h-12 w-8 rounded-lg border-2 flex items-center justify-center text-xl font-bold tabular-nums transition-colors ${
                  filled
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/60"
                } ${shake ? "border-destructive" : ""}`}
              >
                {filled ? "•" : ""}
              </span>
            );
          })}
        </button>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
