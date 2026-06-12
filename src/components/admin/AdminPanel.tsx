import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getTeam } from "@/data/teams";
import { Users, Smartphone, RefreshCw, Activity, Trophy } from "lucide-react";

type PingRow = {
  client_id: string;
  last_ping: string;
  app_version: string;
  fav_team: string | null;
};

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
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
    if (open) load();
  }, [open, load]);

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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl border-primary/30 bg-card/95 backdrop-blur max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-lg flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Admin · Live-Telemetrie
            </DialogTitle>
            <Button size="icon" variant="ghost" onClick={load} disabled={loading} aria-label="Aktualisieren">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </DialogHeader>

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

        <p className="text-[10px] text-muted-foreground text-center pt-1">
          Anonyme Daten · keine IP · keine personenbezogenen Infos
        </p>
      </DialogContent>
    </Dialog>
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
