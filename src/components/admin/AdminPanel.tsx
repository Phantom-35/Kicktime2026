import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { getTeam } from "@/data/teams";
import { Users, Smartphone, RefreshCw, Activity, Trophy, MessageCircle } from "lucide-react";
import { PinGate } from "./PinGate";
import { LiveOverridePanel } from "./LiveOverridePanel";

type PingRow = {
  client_id: string;
  last_ping: string;
  app_version: string;
  fav_team: string | null;
};

const PIN = "031011";

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [unlocked, setUnlocked] = useState(false);

  // Reset PIN lock when the dialog closes
  useEffect(() => {
    if (!open) setUnlocked(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl border-primary/30 bg-card/95 backdrop-blur max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Admin · Kontrollzentrum
          </DialogTitle>
        </DialogHeader>

        {!unlocked ? (
          <PinGate onUnlock={() => setUnlocked(true)} />
        ) : (
          <Tabs defaultValue="telemetry" className="w-full">
            <TabsList className="grid grid-cols-3 w-full h-10 bg-background/60">
              <TabsTrigger value="telemetry" className="text-xs">📊 Telemetrie</TabsTrigger>
              <TabsTrigger value="override" className="text-xs">🎮 Override</TabsTrigger>
              <TabsTrigger value="feedback" className="text-xs">💬 Feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="telemetry" className="mt-3">
              <TelemetryView />
            </TabsContent>
            <TabsContent value="override" className="mt-3">
              <LiveOverridePanel pin={PIN} />
            </TabsContent>
            <TabsContent value="feedback" className="mt-3">
              <FeedbackView />
            </TabsContent>
          </Tabs>
        )}

        <p className="text-[10px] text-muted-foreground text-center pt-1">
          Anonyme Daten · keine IP · keine personenbezogenen Infos
        </p>
      </DialogContent>
    </Dialog>
  );
}

function TelemetryView() {
  const [rows, setRows] = useState<PingRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("app_pings")
      .select("client_id, last_ping, app_version, fav_team");
    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data as PingRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const now = Date.now();
  const activeNow = (rows ?? []).filter(
    (r) => now - new Date(r.last_ping).getTime() <= 5 * 60 * 1000
  ).length;
  const total = rows?.length ?? 0;

  const versionDist = countBy(rows ?? [], (r) => r.app_version);
  const teamDist = countBy(
    (rows ?? []).filter((r) => r.fav_team),
    (r) => r.fav_team as string
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Live-Telemetrie
        </div>
        <Button size="icon" variant="ghost" onClick={load} disabled={loading} aria-label="Aktualisieren">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {err && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2">
          {err}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Metric icon={<Users className="h-4 w-4" />} label="Aktiv (5 min)" value={activeNow} />
        <Metric icon={<Smartphone className="h-4 w-4" />} label="Geräte gesamt" value={total} />
      </div>

      <Section title="App-Versionen">
        <BarList rows={versionDist} total={total} />
      </Section>

      <Section title="Top Fanteams" icon={<Trophy className="h-4 w-4" />}>
        <BarList
          rows={teamDist.slice(0, 5)}
          total={teamDist.reduce((s, r) => s + r.count, 0)}
          renderLabel={(code) => {
            const t = getTeam(code);
            return `${t.flag} ${t.name}`;
          }}
        />
      </Section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-2xl font-black tabular-nums mt-1">{value}</div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function BarList({
  rows,
  total,
  renderLabel,
}: {
  rows: { key: string; count: number }[];
  total: number;
  renderLabel?: (key: string) => string;
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Keine Daten.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => {
        const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
        return (
          <li key={r.key} className="text-xs">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-medium truncate">{renderLabel ? renderLabel(r.key) : r.key}</span>
              <span className="tabular-nums text-muted-foreground">
                {r.count} · {pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function countBy<T>(arr: T[], key: (x: T) => string): { key: string; count: number }[] {
  const m = new Map<string, number>();
  for (const x of arr) {
    const k = key(x);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

type FeedbackSummaryRow = { rating: number; count: number };

function FeedbackView() {
  const [rows, setRows] = useState<FeedbackSummaryRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase.rpc("get_feedback_summary");
    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      const normalized: FeedbackSummaryRow[] = ((data as Array<{ rating: number; count: number | string }>) ?? []).map(
        (r) => ({ rating: Number(r.rating), count: Number(r.count) })
      );
      setRows(normalized);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const get = (rating: number) =>
    rows?.find((r) => r.rating === rating)?.count ?? 0;
  const up = get(1);
  const mid = get(0);
  const down = get(-1);
  const total = up + mid + down;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          User-Feedback
        </div>
        <Button size="icon" variant="ghost" onClick={load} disabled={loading} aria-label="Aktualisieren">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {err && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2">
          {err}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <FeedbackTile emoji="👍" label="Super" count={up} pct={pct(up)} tone="text-emerald-500" />
        <FeedbackTile emoji="😐" label="Geht so" count={mid} pct={pct(mid)} tone="text-amber-500" />
        <FeedbackTile emoji="👎" label="Schlecht" count={down} pct={pct(down)} tone="text-destructive" />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <MessageCircle className="h-3.5 w-3.5" /> Bewertungen gesamt
        </div>
        <div className="text-lg font-black tabular-nums">{total}</div>
      </div>
    </div>
  );
}

function FeedbackTile({
  emoji,
  label,
  count,
  pct,
  tone,
}: {
  emoji: string;
  label: string;
  count: number;
  pct: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className={`text-xl font-black tabular-nums ${tone}`}>{count}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-[10px] text-muted-foreground tabular-nums">{pct}%</div>
    </div>
  );
}
