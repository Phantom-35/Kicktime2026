/**
 * Lazy-loaded WM 2026 Kader-Daten.
 * Das JSON (~5.4k Zeilen) wird erst beim ersten Aufruf von `getTeamSquad`
 * dynamisch geladen und indiziert.
 */
import { apiNameToCode } from "@/utils/teamMapping";

export type Position = "Torwart" | "Abwehr" | "Mittelfeld" | "Sturm";

export type Player = { name: string; position: Position };

export type TeamSquad = {
  code: string;
  land: string;
  trainer: string;
  verbandGegruendet: number;
  wmTitel: number;
  fifaWeltranglistenplatz: number;
  kontinentalverband: string;
  kader: Record<Position, Player[]>;
};

type RawTeam = {
  land: string;
  trainer: string;
  verbandGegruendet: number;
  wmTitel: number;
  fifaWeltranglistenplatz: number;
  kontinentalverband: string;
  kader: { name: string; position: string }[];
};

type RawData = { gruppen: { gruppe: string; teams: RawTeam[] }[] };

let indexCache: Map<string, TeamSquad> | null = null;
let loadPromise: Promise<Map<string, TeamSquad>> | null = null;

const POSITIONS: Position[] = ["Torwart", "Abwehr", "Mittelfeld", "Sturm"];

function buildIndex(raw: RawData): Map<string, TeamSquad> {
  const map = new Map<string, TeamSquad>();
  for (const g of raw.gruppen) {
    for (const t of g.teams) {
      const code = apiNameToCode(t.land);
      if (!code) continue;
      const kader: Record<Position, Player[]> = {
        Torwart: [], Abwehr: [], Mittelfeld: [], Sturm: [],
      };
      for (const p of t.kader) {
        const pos = (POSITIONS as string[]).includes(p.position)
          ? (p.position as Position)
          : null;
        if (pos) kader[pos].push({ name: p.name, position: pos });
      }
      map.set(code, {
        code,
        land: t.land,
        trainer: t.trainer,
        verbandGegruendet: t.verbandGegruendet,
        wmTitel: t.wmTitel,
        fifaWeltranglistenplatz: t.fifaWeltranglistenplatz,
        kontinentalverband: t.kontinentalverband,
        kader,
      });
    }
  }
  return map;
}

async function ensureIndex(): Promise<Map<string, TeamSquad>> {
  if (indexCache) return indexCache;
  if (!loadPromise) {
    loadPromise = import("@/data/wm2026_kader.json").then((mod) => {
      indexCache = buildIndex((mod.default ?? mod) as RawData);
      return indexCache;
    });
  }
  return loadPromise;
}

export async function getTeamSquad(code: string): Promise<TeamSquad | null> {
  const idx = await ensureIndex();
  return idx.get(code) ?? null;
}
