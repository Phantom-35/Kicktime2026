import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { KO_PHASE_LIST, KO_PHASES, determineActiveKoPhase } from "@/lib/ko-phase";
import { Trash2, AlertCircle, Radio, RefreshCw, Database, Loader2, Zap } from "lucide-react";
import { fetchAllStoredFixtures, syncGroupPhase, forceFetchActivePhase } from "@/services/footballApi";
import { applyLiveFixturesToStore } from "@/services/footballApi";
import { toast } from "sonner";

export function SystemMonitor() {
  const adminOverride = useAppStore((s) => s.adminKoPhaseOverride);
  const setAdminOverride = useAppStore((s) => s.setAdminKoPhaseOverride);
  const activeKoPhase = useAppStore((s) => s.activeKoPhase);
  const activeApiUrl = useAppStore((s) => s.activeApiUrl);
  const lastApiFetchAt = useAppStore((s) => s.lastApiFetchAt);
  const errors = useAppStore((s) => s.apiErrorLog);
  const clearErrors = useAppStore((s) => s.clearApiErrorLog);
  const matches = useMatchStore(selectMatchList);

  const [, tick] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [forcing, setForcing] = useState(false);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const runGroupSync = async () => {
    setSyncing(true);
    try {
      const res = await syncGroupPhase();
      if (res.error) {
        toast.error(`Sync fehlgeschlagen: ${res.error}`);
      } else {
        toast.success(`Gruppenphase synchronisiert: ${res.synced} Spiele`);
        const stored = await fetchAllStoredFixtures();
        if (stored.length > 0) applyLiveFixturesToStore(stored);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
    }
  };

  const runForceFetch = async () => {
    setForcing(true);
    try {
      const res = await forceFetchActivePhase(activeKoPhase);
      if (res.error) {
        toast.error(`Force-Fetch fehlgeschlagen: ${res.error}`);
      } else {
        toast.success(
          `Frisch geladen: ${res.fixtures.length} Fixtures` +
            (res.koPhase ? ` (Phase /${res.koPhase})` : " (Gruppen/R32)"),
        );
        const stored = await fetchAllStoredFixtures();
        if (stored.length > 0) applyLiveFixturesToStore(stored);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setForcing(false);
    }
  };

  const autoPhase = useMemo(() => determineActiveKoPhase(matches), [matches]);
  const activeInfo = activeKoPhase ? KO_PHASES[activeKoPhase as 4 | 5 | 6 | 7 | 8 | 9] : null;

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Radio className="h-3.5 w-3.5" /> API- & Fehler-Überwachung
      </div>

      {/* Aktive API */}
      <div className="rounded-xl border border-border bg-background/60 p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Aktiv abgefragte Phase
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
            {adminOverride ? "MANUELL" : "AUTO"}
          </span>
        </div>
        <div className="text-sm font-bold">
          {activeInfo ? `${activeInfo.label} (/${activeInfo.num})` : activeKoPhase === null ? "Gruppen-/R32-Modus" : "—"}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground break-all">
          {activeApiUrl ?? "noch keine Abfrage"}
        </div>
        <div className="text-[10px] text-muted-foreground">
          Letzter Fetch: {lastApiFetchAt ? new Date(lastApiFetchAt).toLocaleTimeString() : "—"}
          {" · "}
          Auto-Vorschlag: {autoPhase ? `Phase ${autoPhase} (${KO_PHASES[autoPhase].label})` : "R32 hardgecodet"}
        </div>
        <Button
          size="sm"
          variant="default"
          className="w-full text-[11px] h-9 gap-2 mt-2"
          onClick={runForceFetch}
          disabled={forcing}
        >
          {forcing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
          Force Fetch (aktive Route — Cache umgehen)
        </Button>
      </div>


      {/* Manueller Override */}
      <div className="rounded-xl border border-border bg-background/60 p-3 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Manueller Override (Backup)
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            size="sm"
            variant={adminOverride === null ? "default" : "outline"}
            className="text-[10px] h-8"
            onClick={() => setAdminOverride(null)}
          >
            Auto
          </Button>
          {KO_PHASE_LIST.map((p) => (
            <Button
              key={p.num}
              size="sm"
              variant={adminOverride === p.num ? "default" : "outline"}
              className="text-[10px] h-8 px-1"
              onClick={() => setAdminOverride(p.num)}
              title={p.url}
            >
              /{p.num} {p.label.split(" ")[0]}
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Standard: Automatisches Weiterschalten sobald alle Spiele einer Phase beendet sind.
        </p>
        <div className="pt-2 border-t border-border/60">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-[11px] h-9 gap-2"
            onClick={runGroupSync}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Database className="h-3.5 w-3.5" />
            )}
            Gruppenphase manuell synchronisieren (wm2026)
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Zieht die komplette Gruppenphase aus der OpenLigaDB in die persistente Datenbank —
            überschreibt keine bereits abgeschlossenen Ergebnisse.
          </p>
        </div>
      </div>


      {/* Fehler-Log */}
      <div className="rounded-xl border border-border bg-background/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" /> Fehler-Log ({errors.length})
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => tick((n) => n + 1)}
              aria-label="Aktualisieren"
              className="h-7 w-7"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={clearErrors}
              disabled={errors.length === 0}
              aria-label="Log leeren"
              className="h-7 w-7"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {errors.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Keine Fehler erfasst.</p>
        ) : (
          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {errors.map((e, i) => (
              <li
                key={`${e.ts}-${i}`}
                className="text-[11px] rounded-lg border border-destructive/30 bg-destructive/10 p-2 space-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-destructive flex items-center gap-1.5">
                    <span className="uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-destructive/20 border border-destructive/40">
                      {e.category ?? "api"}
                    </span>
                    {e.phase ? `Phase ${e.phase}` : "System"}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {new Date(e.ts).toLocaleString()}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground break-all">
                  {e.url}
                </div>
                <div className="text-foreground/90">{e.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
