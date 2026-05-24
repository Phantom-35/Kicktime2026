import { getTeam } from "@/data/teams";
import type { Match } from "@/data/matches";
import { getLocalParts } from "@/lib/time";
import { useAppStore } from "@/store/app-store";
import { Tv, MapPin } from "lucide-react";

export function MatchCard({
  match,
  onClick,
  indicator,
  hideScore,
  children,
}: {
  match: Match;
  onClick?: () => void;
  indicator?: "perfect" | "night" | null;
  hideScore?: boolean;
  children?: React.ReactNode;
}) {
  const tz = useAppStore((s) => s.userTimezone);
  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);
  const local = getLocalParts(match.utcTimestamp, tz);
  return (
    <div
      onClick={onClick}
      className="rounded-2xl border border-border bg-card p-4 active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Gruppe {match.group}
          </span>
          {indicator === "perfect" && (
            <span className="h-2 w-2 rounded-full bg-primary" title="Perfect Match" />
          )}
          {indicator === "night" && (
            <span className="text-accent text-xs" title="Nachtschicht">🌙</span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {local.fullStr}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <TeamSide flag={a.flag} name={a.name} />
        <div className="text-center">
          {match.status === "finished" && match.score ? (
            <div className={`text-xl font-bold tabular-nums ${hideScore ? "blur-md select-none" : ""}`}>
              {match.score.a} : {match.score.b}
            </div>
          ) : (
            <div className="text-xs font-medium text-muted-foreground">VS</div>
          )}
        </div>
        <TeamSide flag={b.flag} name={b.name} align="right" />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Tv className="h-3 w-3" /> {match.broadcaster}
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
