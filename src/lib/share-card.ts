import type { Match } from "@/data/matches";
import { getTeam } from "@/data/teams";
import { getLocalParts } from "@/lib/time";

const W = 1080;
const H = 1350;

function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Generates a 1080×1350 PNG share card for a match. Pure Canvas API — no extra
 * deps. Works in any modern mobile browser; the PNG is returned as a Blob so
 * the caller can either invoke navigator.share() or trigger a download.
 */
export async function generateShareCard(match: Match): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  // Background gradient — Stadium Night
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0b1018");
  bg.addColorStop(1, "#10202a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Accent glow
  const accent = readVar("--primary", "oklch(0.72 0.18 145)");
  const accentRing = ctx.createRadialGradient(W / 2, H * 0.78, 50, W / 2, H * 0.78, 700);
  accentRing.addColorStop(0, "oklch(0.72 0.18 145 / 0.35)");
  accentRing.addColorStop(1, "oklch(0.72 0.18 145 / 0)");
  ctx.fillStyle = accentRing;
  ctx.fillRect(0, 0, W, H);

  // Top brand line
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "600 32px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("KICKTIME · WM 2026", 80, 110);

  // Top-right stage badge
  const stageLabel = stageText(match);
  ctx.textAlign = "right";
  ctx.fillStyle = accent || "rgba(120,220,150,0.9)";
  ctx.font = "700 26px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText(stageLabel.toUpperCase(), W - 80, 110);

  // Teams: flag + name stacked, two columns
  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);

  const flagY = 380;
  ctx.textAlign = "center";
  ctx.font = "200px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
  ctx.fillText(a.flag, W * 0.25, flagY);
  ctx.fillText(b.flag, W * 0.75, flagY);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 60px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText(truncate(a.name, 14), W * 0.25, flagY + 110);
  ctx.fillText(truncate(b.name, 14), W * 0.75, flagY + 110);

  // Middle: score or kickoff
  const local = getLocalParts(match.utcTimestamp);
  if (match.status === "finished" && match.score) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 200px system-ui, -apple-system, sans-serif";
    ctx.fillText(`${match.score.a} : ${match.score.b}`, W / 2, 800);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "500 32px system-ui, -apple-system, sans-serif";
    ctx.fillText("ENDSTAND", W / 2, 850);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "500 32px system-ui, -apple-system, sans-serif";
    ctx.fillText(local.dateStr.toUpperCase(), W / 2, 740);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 180px system-ui, -apple-system, sans-serif";
    ctx.fillText(local.timeStr, W / 2, 880);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "500 28px system-ui, -apple-system, sans-serif";
    ctx.fillText("LOKALE ANSTOSS-ZEIT", W / 2, 920);
  }

  // Bottom: stadium / city
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 34px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${match.stadium}`, W / 2, H - 200);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 28px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${match.city} · ${match.hostCountry}`, W / 2, H - 155);

  // Footer divider + tagline
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, H - 110);
  ctx.lineTo(W - 80, H - 110);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "500 24px system-ui, -apple-system, sans-serif";
  ctx.fillText("Geplant mit KickTime 2026", W / 2, H - 60);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
      0.95
    );
  });
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function stageText(m: Match): string {
  switch (m.stage) {
    case "group":
      return `Gruppe ${m.group}`;
    case "r32":
      return "Sechzehntelfinale";
    case "r16":
      return "Achtelfinale";
    case "qf":
      return "Viertelfinale";
    case "sf":
      return "Halbfinale";
    case "third":
      return "Spiel um Platz 3";
    case "final":
      return "Finale";
    default:
      return "WM 2026";
  }
}

/** Best-effort share: native Web Share with file → fallback to download. */
export async function shareOrDownload(match: Match, blob: Blob): Promise<"shared" | "downloaded"> {
  const filename = `kicktime-${match.id}.png`;
  const file = new File([blob], filename, { type: "image/png" });
  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);
  const text = `${a.flag} ${a.name} vs. ${b.name} ${b.flag} — geplant mit KickTime 2026`;

  const nav = navigator as Navigator & {
    canShare?: (d: ShareData) => boolean;
    share?: (d: ShareData) => Promise<void>;
  };

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "KickTime 2026", text });
      return "shared";
    } catch {
      // user canceled or share failed — fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
