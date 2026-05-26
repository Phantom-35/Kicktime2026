import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { categorizeMatches } from "@/lib/categorize";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchDetailSheet } from "@/components/match/MatchDetailSheet";
import type { Match } from "@/data/matches";
import { getLocalParts } from "@/lib/time";
import { toast } from "sonner";
import { CalendarPlus, BellRing, Play, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const state = useAppStore();
  const matches = useMatchStore(selectMatchList);
  const now = useMatchStore((s) => s.now);
  const cats = useMemo(
    () => categorizeMatches({ ...state, matches, now }),
    [state, matches, now]
  );
  const [selected, setSelected] = useState<Match | null>(null);

  return (
    <div className="p-4 pb-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          Dein WM-Tag
        </h2>
      </div>

      <Tabs defaultValue="perfect" className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-11 bg-card">
          <TabsTrigger value="perfect" className="text-xs">
            🟢 Perfect <span className="ml-1 opacity-60">{cats.perfect.length}</span>
          </TabsTrigger>
          <TabsTrigger value="night" className="text-xs">
            🟡 Nacht <span className="ml-1 opacity-60">{cats.nightShift.length}</span>
          </TabsTrigger>
          <TabsTrigger value="missed" className="text-xs">
            🔴 Verpasst <span className="ml-1 opacity-60">{cats.missed.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfect" className="mt-4">
          <Section
            title="Deine Perfect Matches"
            subtitle="In deinem Zeitfenster – einfach reinsetzen."
            empty="Noch keine perfekten Spiele. Markiere mehr Teams oder erweitere dein Zeitfenster."
          >
            <Stream
              matches={cats.perfect}
              onSelect={setSelected}
              indicator="perfect"
              footer={(m) => (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.success("Zum Kalender hinzugefügt", {
                      description: `${getLocalParts(m.utcTimestamp, state.userTimezone).fullStr}`,
                    });
                  }}
                >
                  <CalendarPlus className="h-4 w-4 mr-1.5" /> Zum Kalender hinzufügen
                </Button>
              )}
            />
          </Section>
        </TabsContent>

        <TabsContent value="night" className="mt-4">
          <Section
            title="Nachtschicht-Highlights"
            subtitle="Top-Spiele außerhalb deines Zeitfensters – Wecker bereit?"
            empty="Keine Nachtspiele aktuell."
          >
            <Stream
              matches={cats.nightShift}
              onSelect={setSelected}
              indicator="night"
              footer={(m) => <AlarmRow match={m} />}
            />
          </Section>
        </TabsContent>

        <TabsContent value="missed" className="mt-4">
          <Section
            title="Guten Morgen, Zusammenfassung!"
            subtitle="Was du im Schlaf verpasst hast."
            empty="Du hast nichts verpasst – sauber!"
          >
            <MissedStream matches={cats.missed} onSelect={setSelected} />
          </Section>
        </TabsContent>
      </Tabs>

      <MatchDetailSheet match={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
}

function Section({
  title, subtitle, empty, children,
}: { title: string; subtitle: string; empty: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
      <AnimatePresence>{children}</AnimatePresence>
      <EmptyHint message={empty} />
    </div>
  );
}

function EmptyHint({ message }: { message: string }) {
  return null; // shown by parent when list empty
}

function Stream({
  matches, onSelect, indicator, footer,
}: {
  matches: Match[];
  onSelect: (m: Match) => void;
  indicator: "perfect" | "night";
  footer?: (m: Match) => React.ReactNode;
}) {
  if (matches.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Nichts hier.</p>;
  }
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {matches.map((m) => (
          <motion.div
            key={m.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <MatchCard match={m} onClick={() => onSelect(m)} indicator={indicator}>
              {footer?.(m)}
            </MatchCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AlarmRow({ match }: { match: Match }) {
  const tz = useAppStore((s) => s.userTimezone);
  const armed = useAppStore((s) => !!s.alarms[match.id]);
  const toggle = useAppStore((s) => s.toggleAlarm);
  const local = getLocalParts(match.utcTimestamp, tz);
  // 15 min before kickoff
  const kickoffMin = (parseInt(local.timeStr.split(":")[0], 10) * 60 + parseInt(local.timeStr.split(":")[1], 10)) - 15;
  const wh = String(Math.floor(((kickoffMin + 1440) % 1440) / 60)).padStart(2, "0");
  const wm = String(((kickoffMin + 1440) % 1440) % 60).padStart(2, "0");
  return (
    <div className="flex items-center justify-between rounded-xl bg-accent/10 border border-accent/30 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-accent" />
        <div className="text-xs">
          <div className="font-semibold">WM-Wecker</div>
          <div className="text-muted-foreground">Erinnerung um {wh}:{wm}</div>
        </div>
      </div>
      <Switch
        checked={armed}
        onCheckedChange={(v) => {
          toggle(match.id);
          if (v) {
            toast.success(`Wecker für ${wh}:${wm} Uhr gestellt!`, {
              description: "Wir senden dir eine Push-Nachricht vor Anpfiff.",
            });
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function MissedStream({ matches, onSelect }: { matches: Match[]; onSelect: (m: Match) => void }) {
  const spoiler = useAppStore((s) => s.spoilerProtection);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  if (matches.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Nichts verpasst.</p>;
  }
  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const hide = spoiler && !revealed[m.id];
        return (
          <div key={m.id} className="relative">
            <MatchCard match={m} onClick={() => onSelect(m)} hideScore={hide}>
              <Button
                size="sm"
                className="w-full bg-primary/90 hover:bg-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.success("Spoilerfreie Highlights werden geladen…");
                }}
              >
                <Play className="h-4 w-4 mr-1.5" /> Spoilerfreie Highlights ansehen
              </Button>
            </MatchCard>
            {hide && (
              <button
                onClick={(e) => { e.stopPropagation(); setRevealed((r) => ({ ...r, [m.id]: true })); }}
                className="absolute top-12 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground font-semibold shadow-lg"
              >
                Ergebnis aufdecken
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
