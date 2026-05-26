import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatHourLabel } from "@/lib/time";
import { TEAMS } from "@/data/teams";

import { toast } from "sonner";
import { RotateCcw, Eye, Globe, Clock, Users, Moon, Sun, Bell, FlaskConical, Cloud } from "lucide-react";


const TIMEZONES = [
  "Europe/Berlin", "Europe/London", "Europe/Madrid",
  "America/New_York", "America/Los_Angeles", "America/Mexico_City",
  "Asia/Tokyo",
];

export const Route = createFileRoute("/profil")({ component: ProfilPage });

function ProfilPage() {
  const s = useAppStore();
  return (
    <div className="p-4 pb-6 space-y-5">
      <h2 className="text-xl font-bold">Profil & Einstellungen</h2>

      <Card icon={<Globe className="h-4 w-4" />} title="Zeitzone">
        <Select value={s.userTimezone} onValueChange={s.setTimezone}>
          <SelectTrigger className="h-11 bg-muted/40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card icon={<Eye className="h-4 w-4" />} title="Spoiler-Schutz">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground pr-3">
            Verberge Ergebnisse vergangener Spiele, bis du sie selbst aufdeckst.
          </p>
          <Switch checked={s.spoilerProtection} onCheckedChange={s.setSpoiler} />
        </div>
      </Card>

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

      <Card icon={<Users className="h-4 w-4" />} title="Teams">
        <div className="grid grid-cols-4 gap-2">
          {TEAMS.map((t) => {
            const fav = s.favoriteTeams.includes(t.code);
            const intg = s.interestingTeams.includes(t.code);
            return (
              <div key={t.code} className="flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-lg border-2 p-2 flex flex-col items-center transition-all
                    ${fav ? "border-primary bg-primary/10" : intg ? "border-accent bg-accent/10" : "border-border"}`}
                >
                  <span className="text-xl">{t.flag}</span>
                  <span className="text-[9px] font-semibold leading-tight mt-0.5">{t.code}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => s.toggleFavorite(t.code)}
                    className={`h-5 w-5 rounded-md flex items-center justify-center active:scale-90 transition
                      ${fav ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    aria-label="Favorit"
                  >
                    <span className="text-[10px]">★</span>
                  </button>
                  <button
                    onClick={() => s.toggleInteresting(t.code)}
                    className={`h-5 w-5 rounded-md flex items-center justify-center active:scale-90 transition
                      ${intg ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
                    aria-label="Interessant"
                  >
                    <span className="text-[10px]">🔔</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

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

      <Card icon={<Bell className="h-4 w-4" />} title="Push-Benachrichtigungen">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground pr-3">
            Match-Erinnerungen 15 Minuten vor Anpfiff.
          </p>
          <Switch
            checked={s.pushEnabled}
            onCheckedChange={async (v) => {
              s.setPushEnabled(v);
              if (v) {
                try {
                  if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
                    await Notification.requestPermission();
                  }
                } catch { /* noop */ }
                toast.success("Push aktiviert", { description: "Wir wecken dich rechtzeitig." });
              } else {
                toast("Push deaktiviert");
              }
            }}
          />
        </div>
      </Card>

      <Card icon={<FlaskConical className="h-4 w-4" />} title="Entwickler-Modus: Live-Daten simulieren">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground pr-3">
            Tickt Live-Scores für das Spiel, das der echten Uhrzeit am nächsten liegt –
            ideal, um Dashboard & Tabellen-Animationen jetzt schon zu testen. Aus = echte
            API-Football-Daten (sobald das Turnier läuft).
          </p>
          <Switch
            checked={s.devSimulateLive}
            onCheckedChange={(v) => {
              s.setDevSimulateLive(v);
              toast(v ? "Live-Simulation aktiv" : "Live-Simulation aus");
            }}
          />
        </div>
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3 text-[11px] leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <Cloud className="h-3.5 w-3.5" /> Live-Daten via Supabase
          </div>
          <p className="text-muted-foreground">
            Echte Live-Scores laufen über die Edge Function{" "}
            <span className="font-mono text-foreground">fetch-live-scores</span>.
            Der API-Schlüssel wird in Supabase → Edge Functions → Secrets als{" "}
            <span className="font-mono text-foreground">API_FOOTBALL_KEY</span>{" "}
            hinterlegt – nie im App-Bundle.
          </p>
        </div>

      </Card>



      <Button
        variant="destructive"
        className="w-full h-12"
        onClick={() => {
          s.resetOnboarding();
          toast("Onboarding zurückgesetzt");
        }}
      >
        <RotateCcw className="h-4 w-4 mr-2" /> Onboarding zurücksetzen
      </Button>

      <p className="text-center text-[10px] text-muted-foreground pt-2">
        KickTime 2026 · Made for football nerds 🇩🇪
      </p>
    </div>
  );
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
