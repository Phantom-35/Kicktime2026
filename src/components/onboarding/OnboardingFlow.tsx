import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/app-store";
import { getSortedTeams, PRIORITY_CODES, type Team } from "@/data/teams";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatHourLabel } from "@/lib/time";
import {
  Globe, Users, Clock, ArrowRight, ArrowLeft, Star, Bell,
  EyeOff, Tv, Trophy, Rocket,
} from "lucide-react";

const TIMEZONES = [
  "Europe/Berlin", "Europe/London", "Europe/Madrid",
  "America/New_York", "America/Los_Angeles", "America/Mexico_City",
  "Asia/Tokyo",
];

const STEP_LABELS = ["Start", "Zeitzone", "Teams", "Zeitfenster"];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const {
    userTimezone, setTimezone,
    favoriteTeams, interestingTeams,
    toggleFavorite, toggleInteresting,
    availability, setAvailability,
    setOnboarded,
  } = useAppStore();

  const canAdvance =
    step === 0 ? true :
    step === 1 ? !!userTimezone :
    step === 2 ? favoriteTeams.length + interestingTeams.length > 0 :
    true;

  return (
    <div className="flex flex-col px-5 py-5">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          {STEP_LABELS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i === step
                  ? "bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
                  : i < step
                  ? "bg-primary/60"
                  : "bg-border"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {STEP_LABELS.map((l, i) => (
            <span key={l} className={i === step ? "text-primary" : ""}>{l}</span>
          ))}
        </div>
      </div>

      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && <WelcomeStep onStart={() => setStep(1)} />}
            {step === 1 && (
              <StepCard>
                <TimezoneStep value={userTimezone} onChange={setTimezone} />
              </StepCard>
            )}
            {step === 2 && (
              <TeamsStep
                favoriteTeams={favoriteTeams}
                interestingTeams={interestingTeams}
                toggleFavorite={toggleFavorite}
                toggleInteresting={toggleInteresting}
              />
            )}
            {step === 3 && (
              <StepCard>
                <AvailabilityStep availability={availability} setAvailability={setAvailability} />
              </StepCard>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {step > 0 && (
        <div className="pt-5 flex gap-2">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="h-12 px-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance}
              className="flex-1 h-12 font-semibold"
            >
              Weiter <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setOnboarded(true)}
              className="flex-1 h-12 font-semibold"
            >
              WM-Planer starten ⚽
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-6 shadow-xl">
      {children}
    </div>
  );
}

/* ---------- Step 0: Welcome ---------- */

function WelcomeStep({ onStart }: { onStart: () => void }) {
  const features = [
    { icon: Clock, title: "Dein Zeitfenster", text: "Spiele passend zu deiner Freizeit." },
    { icon: EyeOff, title: "Spoiler-Schutz", text: "Ergebnisse der Nacht bleiben verdeckt." },
    { icon: Tv, title: "Direkt-Streams", text: "Sofort sehen, ob ARD, ZDF oder MagentaTV überträgt." },
  ];
  return (
    <div className="flex flex-col items-center text-center pt-2">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        className="relative mb-5"
      >
        <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full" />
        <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.45)]">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Trophy className="h-12 w-12 text-primary-foreground" strokeWidth={2.2} />
          </motion.div>
          <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
            <Clock className="h-5 w-5 text-accent-foreground" strokeWidth={2.6} />
          </div>
        </div>
      </motion.div>

      <h1 className="text-3xl font-black tracking-tight mb-2">
        KickTime <span className="text-primary">2026</span>
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
        Verpasse kein wichtiges WM-Spiel mehr trotz Zeitverschiebung.
        Dein persönlicher, spoilerfreier WM-Planer, angepasst an DEINEN Alltag.
      </p>

      <div className="w-full space-y-2.5 mb-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">{f.title}</div>
              <div className="text-xs text-muted-foreground leading-snug">{f.text}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="w-full"
      >
        <Button
          onClick={onStart}
          className="w-full h-14 text-base font-bold shadow-[0_0_30px_hsl(var(--primary)/0.55)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.75)] transition-shadow"
        >
          <Rocket className="h-5 w-5 mr-2" />
          Jetzt einrichten 🚀
        </Button>
      </motion.div>
    </div>
  );
}

/* ---------- Step 1: Timezone ---------- */

function TimezoneStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Globe className="h-10 w-10 text-primary mb-3" />
      <h2 className="text-2xl font-bold mb-1">Deine Zeitzone</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Wir rechnen alle WM-Anstöße in deine lokale Zeit um.
      </p>
      <label className="text-xs font-medium text-muted-foreground">Erkannt</label>
      <Select value={value} onValueChange={onChange}>
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
  );
}

/* ---------- Step 2: Teams (redesigned) ---------- */

function TeamsStep({
  favoriteTeams, interestingTeams, toggleFavorite, toggleInteresting,
}: {
  favoriteTeams: string[];
  interestingTeams: string[];
  toggleFavorite: (c: string) => void;
  toggleInteresting: (c: string) => void;
}) {
  return (
    <div>
      <Users className="h-8 w-8 text-primary mb-2" />
      <h2 className="text-2xl font-bold mb-1">Deine Teams</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Wähle deine Lieblingsmannschaften — wir bauen dein Dashboard drumherum.
      </p>

      <TeamBlock
        kind="favorite"
        title="1. Deine absoluten Favoriten"
        subtitle="Spiele dieser Teams landen ganz oben auf deinem Dashboard und wir erinnern dich rechtzeitig."
        favoriteTeams={favoriteTeams}
        interestingTeams={interestingTeams}
        onTap={toggleFavorite}
      />

      <div className="h-4" />

      <TeamBlock
        kind="interesting"
        title="2. Weitere interessante Teams"
        subtitle="Teams, die du spannend findest (z.B. Geheimfavoriten oder Underdogs)."
        favoriteTeams={favoriteTeams}
        interestingTeams={interestingTeams}
        onTap={toggleInteresting}
      />
    </div>
  );
}

function TeamBlock({
  kind, title, subtitle, favoriteTeams, interestingTeams, onTap,
}: {
  kind: "favorite" | "interesting";
  title: string;
  subtitle: string;
  favoriteTeams: string[];
  interestingTeams: string[];
  onTap: (c: string) => void;
}) {
  const sorted = getSortedTeams();
  const priority = sorted.filter((t) => PRIORITY_CODES.includes(t.code));
  const rest = sorted.filter((t) => !PRIORITY_CODES.includes(t.code));

  const Icon = kind === "favorite" ? Star : Bell;
  const headerColor = kind === "favorite" ? "text-primary" : "text-accent";

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${headerColor}`} fill="currentColor" />
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug mb-3">{subtitle}</p>

      <div className="grid grid-cols-3 gap-2">
        {priority.map((t) => (
          <TeamChip
            key={t.code} team={t} kind={kind}
            favoriteTeams={favoriteTeams}
            interestingTeams={interestingTeams}
            onTap={onTap}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 my-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
          Weitere Nationen
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {rest.map((t) => (
          <TeamChip
            key={t.code} team={t} kind={kind}
            favoriteTeams={favoriteTeams}
            interestingTeams={interestingTeams}
            onTap={onTap}
          />
        ))}
      </div>
    </section>
  );
}

function TeamChip({
  team, kind, favoriteTeams, interestingTeams, onTap,
}: {
  team: Team;
  kind: "favorite" | "interesting";
  favoriteTeams: string[];
  interestingTeams: string[];
  onTap: (c: string) => void;
}) {
  const isFav = favoriteTeams.includes(team.code);
  const isInt = interestingTeams.includes(team.code);
  const isSelectedHere = kind === "favorite" ? isFav : isInt;
  const isClaimedElsewhere = kind === "favorite" ? isInt : isFav;

  const activeClasses = isSelectedHere
    ? kind === "favorite"
      ? "border-primary bg-primary/15 shadow-[0_0_14px_hsl(var(--primary)/0.35)]"
      : "border-accent bg-accent/15 shadow-[0_0_14px_hsl(var(--accent)/0.3)]"
    : isClaimedElsewhere
      ? "border-border bg-muted/30 opacity-50"
      : "border-border bg-background/40 hover:border-primary/50";

  const Badge = kind === "favorite" ? Star : Bell;
  const badgeColor = kind === "favorite" ? "text-primary" : "text-accent";

  return (
    <button
      onClick={() => onTap(team.code)}
      className={`relative rounded-xl border-2 p-2.5 flex flex-col items-center gap-1 active:scale-95 transition-all min-h-[78px] ${activeClasses}`}
    >
      {isSelectedHere && (
        <Badge
          className={`absolute top-1.5 right-1.5 h-3.5 w-3.5 ${badgeColor}`}
          fill="currentColor"
        />
      )}
      {isClaimedElsewhere && (
        <span className="absolute top-1 right-1.5 text-[8px] text-muted-foreground">
          {isFav ? "⭐" : "🔔"}
        </span>
      )}
      <span className="text-2xl leading-none mt-0.5">{team.flag}</span>
      <span className="text-[10.5px] font-semibold leading-tight text-center line-clamp-2">
        {team.name}
      </span>
    </button>
  );
}

/* ---------- Step 3: Availability ---------- */

function AvailabilityStep({
  availability, setAvailability,
}: {
  availability: { weekday: { start: number; end: number }; weekend: { start: number; end: number } };
  setAvailability: (a: typeof availability) => void;
}) {
  return (
    <div>
      <Clock className="h-9 w-9 text-primary mb-3" />
      <h2 className="text-2xl font-bold mb-1">Deine Zeitfenster</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Wann hast du Zeit, live zu schauen?
      </p>
      <TimeRange
        label="Unter der Woche"
        value={availability.weekday}
        allowOverflow
        onChange={(w) => setAvailability({ ...availability, weekday: w })}
        presets={[
          { label: "Feierabend", range: { start: 17, end: 23.5 } },
          { label: "Ganztägig", range: { start: 0, end: 24 } },
          { label: "Nachtaktiv", range: { start: 20, end: 4 } },
        ]}
      />
      <div className="h-4" />
      <TimeRange
        label="Am Wochenende"
        value={availability.weekend}
        onChange={(w) => setAvailability({ ...availability, weekend: w })}
        allowOverflow
        presets={[
          { label: "Tag & Abend", range: { start: 12, end: 23.5 } },
          { label: "Ganztägig", range: { start: 10, end: 2 } },
          { label: "Nachtaktiv", range: { start: 20, end: 4 } },
        ]}
      />
    </div>
  );
}

function TimeRange({
  label, value, onChange, allowOverflow, presets,
}: {
  label: string;
  value: { start: number; end: number };
  onChange: (w: { start: number; end: number }) => void;
  allowOverflow?: boolean;
  presets?: { label: string; range: { start: number; end: number } }[];
}) {
  const max = allowOverflow ? 28 : 24;
  const endDisplay =
    allowOverflow && value.end < value.start ? value.end + 24 : value.end;
  const normalizedEnd = value.end > 24 ? value.end - 24 : value.end;
  const isOverflow = allowOverflow && endDisplay > 24;

  const applyPreset = (range: { start: number; end: number }) => {
    onChange(range);
  };

  return (
    <div className="rounded-2xl bg-background/40 border border-border p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums text-primary mb-4 flex items-baseline gap-2">
        <span>⏰</span>
        <span>
          {formatHourLabel(value.start)} – {formatHourLabel(normalizedEnd)}
        </span>
        {isOverflow && (
          <span className="text-xs font-medium text-muted-foreground">+1 Tag</span>
        )}
      </div>

      <Slider
        min={0} max={max} step={0.5}
        value={[value.start, endDisplay]}
        onValueChange={([s, e]) => {
          if (s === e) return;
          const start = Math.min(s, e);
          const end = Math.max(s, e);
          onChange({ start, end: end > 24 ? end - 24 : end });
        }}
        minStepsBetweenThumbs={1}
        className="my-2"
      />

      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums mt-1 mb-3 px-0.5">
        <span>00</span><span>06</span><span>12</span><span>18</span>
        <span>{allowOverflow ? "+04" : "24"}</span>
      </div>

      {presets && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => {
            const active =
              p.range.start === value.start && p.range.end === value.end;
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p.range)}
                className={`text-[11px] font-medium px-2.5 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                {p.label} ({formatHourLabel(p.range.start)}–{formatHourLabel(p.range.end)})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

