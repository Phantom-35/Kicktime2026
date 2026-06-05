import type { Match } from "@/data/matches";

export type Prediction = { a: number; b: number; createdAt: number };
export type PredictionResult = "exact" | "diff" | "tendency" | "miss";

export function scorePrediction(
  pred: { a: number; b: number },
  score: { a: number; b: number }
): { result: PredictionResult; points: number } {
  if (pred.a === score.a && pred.b === score.b) {
    return { result: "exact", points: 3 };
  }
  const predDiff = pred.a - pred.b;
  const realDiff = score.a - score.b;
  if (predDiff !== 0 && predDiff === realDiff) {
    return { result: "diff", points: 2 };
  }
  const predWinner = Math.sign(predDiff);
  const realWinner = Math.sign(realDiff);
  if (predWinner === realWinner) {
    return { result: "tendency", points: 1 };
  }
  return { result: "miss", points: 0 };
}

export type PredictionSummary = {
  total: number;
  rated: number;
  open: number;
  exact: number;
  diff: number;
  tendency: number;
  miss: number;
  points: number;
  hitRate: number; // 0..1, share of rated tips with ≥1 point
};

export function summarize(
  predictions: Record<string, Prediction>,
  matches: Pick<Match, "id" | "status" | "score">[]
): PredictionSummary {
  const byId = new Map(matches.map((m) => [m.id, m]));
  let exact = 0,
    diff = 0,
    tendency = 0,
    miss = 0,
    points = 0,
    rated = 0,
    open = 0;
  const total = Object.keys(predictions).length;
  for (const [matchId, pred] of Object.entries(predictions)) {
    const m = byId.get(matchId);
    if (!m) continue;
    if (m.status === "finished" && m.score) {
      const r = scorePrediction(pred, m.score);
      rated++;
      points += r.points;
      if (r.result === "exact") exact++;
      else if (r.result === "diff") diff++;
      else if (r.result === "tendency") tendency++;
      else miss++;
    } else {
      open++;
    }
  }
  const hits = exact + diff + tendency;
  return {
    total,
    rated,
    open,
    exact,
    diff,
    tendency,
    miss,
    points,
    hitRate: rated === 0 ? 0 : hits / rated,
  };
}

export const RESULT_LABEL: Record<PredictionResult, string> = {
  exact: "Volltreffer",
  diff: "Differenz",
  tendency: "Tendenz",
  miss: "Daneben",
};
