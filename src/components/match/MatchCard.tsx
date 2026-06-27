import { getTeam } from "@/data/teams";
import type { Match } from "@/data/matches";
import { getLocalParts } from "@/lib/time";
import { useAppStore } from "@/store/app-store";
import { getBroadcastersForMatch, hasAnyFreeTv, hasMagentaTv } from "@/lib/broadcaster";
import { getMatchPhaseLabel } from "@/lib/match-phase";
import { Tv, MapPin } from "lucide-react";

type MatchLike = Match & {
  liveScore?: { a: number; b: number };
  matchMinute?: number;
};

export function MatchCard({
  match,
  onClick,
  indicator,
  hideScore,
  children,
}: {
  match: MatchLike;
  onClick?: () => void;
  indicator?: "perfect" | "night" | null;
  hideScore?: boolean;
  children?: React.ReactNode;
}) {
  const tz = useAppStore((s) => s.userTimezone);
  const favorites = useAppStore((s) => s.favoriteTeams);
  const interesting = useAppStore((s) => s.interestingTeams);
  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);
  const local = getLocalParts(match.utcTimestamp, tz);
  const isLive = match.status === "live";

  // Dynamisches Ampelsystem:
  //  - Grün, wenn mind. ein Team als Top-Team (favorite) markiert ist
  //  - Gelb, wenn kein Top-Team, aber mind. ein Team als interessant markiert ist
  //  - Sonst kein Punkt
  const isTop = favorites.includes(match.teamA) || favorites.includes(match.teamB);
  const isInteresting =
    !isTop && (interesting.includes(match.teamA) || interesting.includes(match.teamB));

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-card p-4 active:scale-[0.98] transition-transform cursor-pointer ${
        isLive ? "border-2 border-destructive ring-2 ring-destructive/30" : "border border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.stage === "group" ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Gruppe {match.group}
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground border border-accent ring-1 ring-accent/40 shadow-sm">
              KO-Runde
            </span>
          )}

          {isTop && (
            <span className="h-2 w-2 rounded-full bg-emerald-500" title="Top-Team" />
          )}
          {isInteresting && (
            <span className="h-2 w-2 rounded-full bg-amber-400" title="Interessantes Team" />
          )}
          {indicator === "night" && (
            <span className="text-accent text-xs" title="Nachtschicht">🌙</span>
          )}
          {match.status === "live" && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/15 border border-destructive/40 rounded-full px-2 py-0.5">
              Läuft · {getMatchPhaseLabel(match)}
            </span>
          )}
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground bg-muted/60 border border-border/60 rounded-full px-2.5 py-1">
          {local.fullStr}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <TeamSide flag={a.flag} name={a.name} />
        <div className="text-center">
          {match.status === "live" && match.liveScore ? (
            <div className="text-xl font-bold tabular-nums text-destructive">
              {match.liveScore.a} : {match.liveScore.b}
            </div>
          ) : match.status === "finished" && match.score ? (
            <div className={`text-xl font-bold tabular-nums ${hideScore ? "blur-md select-none" : ""}`}>
              {match.score.a} : {match.score.b}
            </div>
          ) : match.status === "finished" ? (
            <div className="text-xl font-bold tabular-nums text-muted-foreground">- : -</div>
          ) : (
            <div className="text-xs font-medium text-muted-foreground">VS</div>
          )}
        </div>
        <TeamSide flag={b.flag} name={b.name} align="right" />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Tv className="h-3 w-3" /> {formatBroadcasters(match)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {match.city}
        </span>
      </div>

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

function TeamSide({ flag, name, align = "left" }: { flag: string; name: string; align?: "left" | "right" }) {
  return (
    <div className={`flex-1 flex items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <span className="text-2xl">{flag}</span>
      <span className="text-sm font-semibold leading-tight">{name}</span>
    </div>
  );
}

function formatBroadcasters(match: Match): string {
  const parts: string[] = [];
  if (hasAnyFreeTv(match)) parts.push("ARD/ZDF");
  if (hasMagentaTv(match)) parts.push("MagentaTV");
  if (parts.length === 0) {
    const list = getBroadcastersForMatch(match);
    return list.join(" · ");
  }
  return parts.join(" · ");
}
