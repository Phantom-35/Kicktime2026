import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatHourLabel } from "@/lib/time";
import { REAL_TEAMS as TEAMS } from "@/data/teams";
import { detectPushSupport, requestPushPermission } from "@/lib/notifications";

import { toast } from "sonner";
import {
  RotateCcw, Eye, Clock, Users, Moon, Sun, Bell, Trash2, ExternalLink,
} from "lucide-react";

const APP_VERSION = "3.4.0";

export const Route = createFileRoute("/profil")({ component: ProfilPage });

function ProfilPage() {
  const s = useAppStore();
  return (
    <div className="p-4 pb-6 space-y-5">
      <h2 className="text-xl font-bold">Profil & Einstellungen</h2>

      <div className="space-y-5 md:space-y-0 md:columns-2 lg:columns-3 md:gap-5">
        <div className="md:break-inside-avoid md:mb-5">
          <Card icon={<Eye className="h-4 w-4" />} title="Spoiler-Schutz">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground pr-3">
                Verberge Ergebnisse vergangener Spiele, bis du sie selbst aufdeckst.
              </p>
              <Switch checked={s.spoilerProtection} onCheckedChange={s.setSpoiler} className="data-[state=unchecked]:bg-destructive" />
            </div>
          </Card>
        </div>

        <div className="md:break-inside-avoid md:mb-5">
          <Card icon={<Clock className="h-4 w-4" />} title="Zeitfenster">
            <Range
              label="Unter der Woche"
              value={s.availability.weekday}
              onChange={(w) => s.setAvailability({ ...s.availability, weekday: w })}
            />
            <div className="h-3" />
            <Range
              label="Am Wochenende"
              value={s.availability.weekend}
              onChange={(w) => s.setAvailability({ ...s.availability, weekend: w })}
              allowOverflow
            />
          </Card>
        </div>

        <div className="md:break-inside-avoid md:mb-5">
          <Card icon={s.theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} title="Design-Modus">
            <div className="flex items-center justify-between">
              <div className="pr-3">
                <p className="text-xs font-medium">
                  {s.theme === "light" ? "Hell" : "Dunkel"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {s.theme === "light"
                    ? "Heller Hintergrund mit dunklem Text."
                    : "Stadion-Nacht-Look mit Pitch-Green."}
                </p>
              </div>
              <Switch
                checked={s.theme === "light"}
                onCheckedChange={(v) => {
                  s.setTheme(v ? "light" : "dark");
                  toast(v ? "Light-Mode aktiviert" : "Dark-Mode aktiviert");
                }}
              />
            </div>
          </Card>
        </div>

        <div className="md:break-inside-avoid md:mb-5">
          <Card icon={<Bell className="h-4 w-4" />} title="Push-Benachrichtigungen">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground pr-3">
                Match-Erinnerungen 15 Minuten vor Anpfiff.
              </p>
              <Switch
                checked={s.pushEnabled}
                onCheckedChange={async (v) => {
                  if (!v) {
                    s.setPushEnabled(false);
                    toast("Push deaktiviert");
                    return;
                  }
                  const support = detectPushSupport();
                  if (support === "unsupported") {
                    toast.error("Push nicht unterstützt", {
                      description: "Dein Browser unterstützt keine Web-Benachrichtigungen.",
                    });
                    return;
                  }
                  if (support === "ios-needs-pwa") {
                    toast.error("Auf dem iPhone zuerst zum Home-Bildschirm hinzufügen", {
                      description:
                        "Safari → Teilen → 'Zum Home-Bildschirm'. Push funktioniert nur in der installierten App.",
                      duration: 8000,
                    });
                    return;
                  }
                  const result = await requestPushPermission();
                  if (result === "granted") {
                    s.setPushEnabled(true);
                    toast.success("Push aktiviert", {
                      description: "Wir wecken dich rechtzeitig vor Anpfiff.",
                    });
                  } else if (result === "denied") {
                    toast.error("Berechtigung verweigert", {
                      description: "Erlaube Benachrichtigungen in den Browser-Einstellungen.",
                      duration: 7000,
                    });
                  } else {
                    toast("Berechtigung ausstehend");
                  }
                }}
              />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
              iPhone: nur als installierte App (iOS 16.4+). Android/Desktop: direkt im Browser.
            </p>

            <div className={`mt-3 pt-3 border-t border-border/50 pl-3 border-l-2 ${s.pushEnabled ? "border-l-primary/40" : "border-l-border"}`}>
              <div className="flex items-center justify-between">
                <div className="pr-3">
                  <p className={`text-xs font-medium ${!s.pushEnabled ? "opacity-50" : ""}`}>
                    Automatisch für Favoriten
                  </p>
                  <p className={`text-[11px] text-muted-foreground leading-snug ${!s.pushEnabled ? "opacity-50" : ""}`}>
                    Aktiviert automatisch die Erinnerungs-Glocke für alle Spiele deiner Favoriten-Teams.
                  </p>
                </div>
                <Switch
                  checked={s.autoAlarmFavorites}
                  disabled={!s.pushEnabled}
                  onCheckedChange={(v) => {
                    s.setAutoAlarmFavorites(v);
                    toast(v ? "Auto-Erinnerung für Favoriten aktiviert" : "Auto-Erinnerung deaktiviert");
                  }}
                />
              </div>
            </div>
          </Card>
        </div>


        <div className="md:break-inside-avoid md:mb-5">
          <Card icon={<Users className="h-4 w-4" />} title="Teams">
            <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
              Tippe: 1× <span className="text-primary font-semibold">Favorit</span> ·
              2× <span className="text-accent font-semibold">Interessant</span> ·
              3× Entfernen
            </p>
            <div className="grid grid-cols-4 gap-2">
              {TEAMS.map((t) => {
                const fav = s.favoriteTeams.includes(t.code);
                const intg = s.interestingTeams.includes(t.code);
                const cycle = () => {
                  if (!fav && !intg) {
                    // none → favorite
                    s.toggleFavorite(t.code);
                  } else if (fav) {
                    // favorite → interesting
                    s.toggleFavorite(t.code); // remove fav
                    s.toggleInteresting(t.code); // add intg
                  } else {
                    // interesting → none
                    s.toggleInteresting(t.code);
                  }
                };
                return (
                  <button
                    key={t.code}
                    onClick={cycle}
                    aria-label={`${t.name}: ${fav ? "Favorit" : intg ? "Interessant" : "nicht ausgewählt"}`}
                    className={`w-full rounded-lg border-2 p-2 flex flex-col items-center transition-all active:scale-95
                      ${fav
                        ? "border-primary bg-primary/15 shadow-[0_0_10px_hsl(var(--primary)/0.35)]"
                        : intg
                        ? "border-accent bg-accent/15"
                        : "border-border hover:border-primary/40"}`}
                  >
                    <span className="text-xl">{t.flag}</span>
                    <span className="text-[9px] font-semibold leading-tight mt-0.5">{t.code}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full h-12"
        onClick={() => {
          s.resetOnboarding();
          toast("Onboarding zurückgesetzt");
        }}
      >
        <RotateCcw className="h-4 w-4 mr-2" /> Onboarding zurücksetzen
      </Button>

      <Card icon={<Trash2 className="h-4 w-4" />} title="Alle Daten löschen">
        <p className="text-xs text-muted-foreground mb-3">
          Setzt die App vollständig zurück: Favoriten, Wecker, Einstellungen und
          Onboarding-Status werden entfernt.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full h-11">
              <Trash2 className="h-4 w-4 mr-2" /> Alle Daten löschen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Wirklich alle Daten löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Alle Favoriten,
                Wecker und Einstellungen gehen verloren.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  try {
                    localStorage.removeItem("kicktime-2026");
                    Object.keys(localStorage)
                      .filter((k) => k.startsWith("kicktime"))
                      .forEach((k) => localStorage.removeItem(k));
                    sessionStorage.clear();
                  } catch {
                    /* noop */
                  }
                  toast.success("Alle Daten gelöscht", {
                    description: "Du kannst die App jetzt komplett neu verwenden.",
                  });
                  setTimeout(() => window.location.reload(), 900);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Ja, alles löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>

      <p className="text-center text-[10px] text-muted-foreground pt-2">
        KickTime 2026 · Made by Phantom Studios
      </p>
      <p className="text-center text-[10px] text-muted-foreground/70 -mt-3">
        Version {APP_VERSION}
      </p>
      <p className="text-center text-[10px] text-muted-foreground/50 -mt-3">
        <a
          href="https://kicktime2026.de"
          target="_blank"
          rel="external noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            openExternalLink("https://kicktime2026.de");
          }}
          className="underline hover:text-muted-foreground transition-colors inline-flex items-center gap-0.5"
        >
          Datenschutz & Impressum <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </p>
    </div>
  );
}

function openExternalLink(url: string) {
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;

  // Android PWA: Intent-URL erzwingt den externen Browser.
  if (isStandalone && isAndroid) {
    const stripped = url.replace(/^https?:\/\//, "");
    const intentUrl =
      "intent://" +
      stripped +
      "#Intent;scheme=https;action=android.intent.action.VIEW;end";
    window.location.href = intentUrl;
    return;
  }

  // iOS PWA + alle anderen: Ein Form-Submit mit target="_blank" wird von
  // iOS aus standalone PWAs an Safari delegiert (im Gegensatz zu window.open
  // oder anchor.click(), die im in-App-WebView landen).
  try {
    const form = document.createElement("form");
    form.method = "GET";
    form.action = url;
    form.target = "_blank";
    form.rel = "noopener noreferrer";
    form.style.display = "none";
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
      if (form.parentNode) document.body.removeChild(form);
    }, 100);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}


function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function Range({
  label, value, onChange, allowOverflow,
}: {
  label: string;
  value: { start: number; end: number };
  onChange: (w: { start: number; end: number }) => void;
  allowOverflow?: boolean;
}) {
  const max = allowOverflow ? 28 : 24;
  const endDisplay = value.end < value.start && allowOverflow ? value.end + 24 : value.end;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs tabular-nums text-primary font-semibold">
          {formatHourLabel(value.start)} – {formatHourLabel(value.end)}
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
