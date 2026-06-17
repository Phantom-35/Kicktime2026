import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { categorizeMatches } from "@/lib/categorize";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchDetailSheet } from "@/components/match/MatchDetailSheet";
import { AlarmBell } from "@/components/match/AlarmBell";
import { LiveNowBar } from "@/components/match/LiveNowBar";
import { TournamentCountdown } from "@/components/dashboard/TournamentCountdown";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import { incrementOpenCount, shouldShowFeedback, markFeedbackShown } from "@/lib/open-counter";
import type { Match } from "@/data/matches";
import { getLocalParts } from "@/lib/time";
import { toast } from "sonner";
import { CalendarPlus, BellRing, Sparkles } from "lucide-react";
import { addMatchToCalendar } from "@/lib/calendar";
import { haptics } from "@/lib/haptics";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const state = useAppStore();
  const matches = useMatchStore(selectMatchList);
  const now = useMatchStore((s) => s.now);

  // Determine current tournament phase: while any group match is still
  // scheduled or live, we're in "group" phase. Once the group stage is done,
  // automatically switch to KO and only consider knockout matches.
  const phase: "group" | "ko" = useMemo(() => {
    const groupPending = matches.some(
      (m) => m.stage === "group" && m.status !== "finished"
    );
    return groupPending ? "group" : "ko";
  }, [matches]);

  const phaseMatches = useMemo(
    () =>
      phase === "group"
        ? matches.filter((m) => m.stage === "group")
        : matches.filter((m) => m.stage !== "group"),
    [matches, phase]
  );

  const cats = useMemo(
    () => categorizeMatches({ ...state, matches: phaseMatches, now }),
    [state, phaseMatches, now]
  );

  const perfectSorted = useMemo(() => {
    const priority = (m: typeof cats.perfect[number]) => {
      const fav = state.favoriteTeams.includes(m.teamA) || state.favoriteTeams.includes(m.teamB);
      if (fav) return 0;
      const interesting = state.interestingTeams.includes(m.teamA) || state.interestingTeams.includes(m.teamB);
      if (interesting) return 1;
      return 2;
    };
    return [...cats.perfect].sort((a, b) => {
      const da = getLocalParts(a.utcTimestamp).dayKey;
      const db = getLocalParts(b.utcTimestamp).dayKey;
      if (da !== db) return da < db ? -1 : 1;
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;
      return new Date(a.utcTimestamp).getTime() - new Date(b.utcTimestamp).getTime();
    });
  }, [cats.perfect, state.favoriteTeams, state.interestingTeams]);

  const specialSorted = useMemo(() => {
    const list = phaseMatches.filter(
      (m) =>
        m.teamA === "GER" ||
        m.teamB === "GER" ||
        (m.stage !== "group" && m.stage !== "r32")
    );
    return [...list].sort(
      (a, b) => new Date(a.utcTimestamp).getTime() - new Date(b.utcTimestamp).getTime()
    );
  }, [phaseMatches]);

  const [selected, setSelected] = useState<Match | null>(null);
  const showCountdown = useAppStore((s) => s.showCountdown);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  useEffect(() => {
    const count = incrementOpenCount();
    if (shouldShowFeedback(count)) {
      markFeedbackShown(count);
      // small delay so it doesn't fight with WhatsNew / splash
      const t = setTimeout(() => setFeedbackOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div className="p-4 pb-6">
      <AnimatePresence>
        {showCountdown && <TournamentCountdown key="countdown" />}
      </AnimatePresence>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          Dein WM-Tag
        </h2>
        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
          {phase === "group" ? "Gruppenphase" : "K.-o.-Runde"}
        </span>
      </div>

      <Tabs defaultValue="perfect" className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-11 bg-card">
          <TabsTrigger value="perfect" className="text-[11px] px-1">
            🟢 Perfect <span className="ml-1 opacity-60">{cats.perfect.length}</span>
          </TabsTrigger>
          <TabsTrigger value="night" className="text-[11px] px-1">
            🟡 Nacht <span className="ml-1 opacity-60">{cats.nightShift.length}</span>
          </TabsTrigger>
          <TabsTrigger value="missed" className="text-[11px] px-1">
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
              matches={perfectSorted}
              onSelect={setSelected}
              indicator="perfect"
              footer={(m) => (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        addMatchToCalendar(m);
                        haptics.tap();
                        toast.success("Kalender wird geöffnet…", {
                          description: getLocalParts(m.utcTimestamp).fullStr,
                        });
                      } catch {
                        toast.error("Konnte Kalender nicht öffnen");
                      }
                    }}
                  >
                    <CalendarPlus className="h-4 w-4 mr-1.5" /> Zum Kalender hinzufügen
                  </Button>
                  <AlarmBell match={m} />
                </div>
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
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
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
  indicator: "perfect" | "night" | null;
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
  const armed = useAppStore((s) => !!s.alarms[match.id]);
  const toggle = useAppStore((s) => s.toggleAlarm);
  const local = getLocalParts(match.utcTimestamp);
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
  const revealedMap = useAppStore((s) => s.revealedMatches);
  const revealMatch = useAppStore((s) => s.revealMatch);
  if (matches.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Nichts verpasst.</p>;
  }
  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const hide = spoiler && !revealedMap[m.id];
        return (
          <div key={m.id} className="relative">
            <MatchCard match={m} onClick={() => onSelect(m)} hideScore={hide} />
            {hide && (
              <button
                onClick={(e) => { e.stopPropagation(); revealMatch(m.id); }}
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

