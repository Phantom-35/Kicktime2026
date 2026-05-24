import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/app-store";
import { TEAMS } from "@/data/teams";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatHourLabel } from "@/lib/time";
import { Globe, Users, Clock, ArrowRight } from "lucide-react";

const TIMEZONES = [
  "Europe/Berlin", "Europe/London", "Europe/Madrid",
  "America/New_York", "America/Los_Angeles", "America/Mexico_City",
  "Asia/Tokyo",
];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const {
    userTimezone, setTimezone,
    favoriteTeams, interestingTeams, toggleTeam,
    availability, setAvailability,
    setOnboarded,
  } = useAppStore();

  const steps = [
    { title: "Zeitzone", icon: Globe },
    { title: "Teams", icon: Users },
    { title: "Zeitfenster", icon: Clock },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col px-5 py-6">
      <div className="mb-6 flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/60" : "w-4 bg-border"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="flex-1"
        >
          {step === 0 && (
            <div>
              <Globe className="h-10 w-10 text-primary mb-3" />
              <h2 className="text-2xl font-bold mb-1">Deine Zeitzone</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Wir rechnen alle WM-Anstöße in deine lokale Zeit um.
              </p>
              <label className="text-xs font-medium text-muted-foreground">Erkannt</label>
              <Select value={userTimezone} onValueChange={setTimezone}>
                <SelectTrigger className="mt-1.5 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 1 && (
            <div>
              <Users className="h-10 w-10 text-primary mb-3" />
              <h2 className="text-2xl font-bold mb-1">Deine Teams</h2>
              <p className="text-sm text-muted-foreground mb-5">
                1× tippen = ⭐ Favorit, 2× = 🔔 Interessant, 3× = entfernen.
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {TEAMS.map((t) => {
                  const fav = favoriteTeams.includes(t.code);
                  const intg = interestingTeams.includes(t.code);
                  return (
                    <button
                      key={t.code}
                      onClick={() => toggleTeam(t.code)}
                      className={`rounded-xl border-2 p-3 flex flex-col items-center gap-1 active:scale-95 transition-all
                        ${fav ? "border-primary bg-primary/10" : intg ? "border-accent bg-accent/10" : "border-border bg-card"}`}
                    >
                      <span className="text-2xl">{t.flag}</span>
                      <span className="text-[11px] font-semibold leading-tight text-center">
                        {t.name}
                      </span>
                      <span className="text-[10px]">
                        {fav ? "⭐" : intg ? "🔔" : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <Clock className="h-10 w-10 text-primary mb-3" />
              <h2 className="text-2xl font-bold mb-1">Deine Zeitfenster</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Wann hast du Zeit, live zu schauen?
              </p>
              <TimeRange
                label="Unter der Woche"
                value={availability.weekday}
                onChange={(w) => setAvailability({ ...availability, weekday: w })}
              />
              <div className="h-4" />
              <TimeRange
                label="Am Wochenende"
                value={availability.weekend}
                onChange={(w) => setAvailability({ ...availability, weekend: w })}
                allowOverflow
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pt-6 flex gap-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 h-12">
            Zurück
          </Button>
        )}
        {step < 2 ? (
          <Button onClick={() => setStep(step + 1)} className="flex-1 h-12 font-semibold">
            Weiter <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => setOnboarded(true)} className="flex-1 h-12 font-semibold">
            WM-Planer starten ⚽
          </Button>
        )}
      </div>
    </div>
  );
}

function TimeRange({
  label, value, onChange, allowOverflow,
}: {
  label: string;
  value: { start: number; end: number };
  onChange: (w: { start: number; end: number }) => void;
  allowOverflow?: boolean;
}) {
  const max = allowOverflow ? 28 : 24; // overflow lets weekend run past midnight
  const endDisplay = value.end < value.start && allowOverflow ? value.end + 24 : value.end;
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tabular-nums text-primary font-semibold">
          {formatHourLabel(value.start)} – {formatHourLabel(value.end > 24 ? value.end - 24 : value.end)}
          {allowOverflow && endDisplay > 24 ? " +1" : ""}
        </span>
      </div>
      <Slider
        min={0} max={max} step={0.5}
        value={[value.start, endDisplay]}
        onValueChange={([s, e]) => onChange({ start: s, end: e > 24 ? e - 24 : e })}
      />
    </div>
  );
}
