export type Broadcaster = "ARD" | "ZDF" | "MagentaTV";

export type MatchStage = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";

export type Match = {
  id: string;
  teamA: string;
  teamB: string;
  group: string;
  stage: MatchStage;
  matchday?: number;
  stadium: string;
  city: string;
  hostCountry: "USA" | "MEX" | "CAN";
  utcTimestamp: string;
  broadcaster: Broadcaster;
  status: "scheduled" | "live" | "finished";
  score?: { a: number; b: number };
  /** Travel tip for the host city (airport, transit). */
  travelInfo: string;
  /** Typical June/July climate baseline for the host city. */
  weatherForecast: string;
};
