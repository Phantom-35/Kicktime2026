/**
 * Renders a country flag as an SVG/PNG via flagcdn.com so it works on
 * platforms (Windows Chrome, older Android) that lack emoji-flag fonts.
 * Falls back to the emoji string if no mapping is found.
 */

const FLAG_CDN: Record<string, string> = {
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
  CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct",
  USA: "us", PAR: "py", AUS: "au", TUR: "tr",
  GER: "de", CUW: "cw", CIV: "ci", ECU: "ec",
  NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  FRA: "fr", SEN: "sn", IRQ: "iq", NOR: "no",
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  POR: "pt", COD: "cd", UZB: "uz", COL: "co",
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
};

export function Flag({
  code,
  emoji,
  size = 24,
  className = "",
}: {
  code: string;
  emoji?: string;
  size?: number;
  className?: string;
}) {
  const slug = FLAG_CDN[code];
  if (!slug) {
    return <span className={className} style={{ fontSize: size }}>{emoji ?? code}</span>;
  }
  const w = size * 2;
  return (
    <img
      src={`https://flagcdn.com/w${w}/${slug}.png`}
      srcSet={`https://flagcdn.com/w${w * 2}/${slug}.png 2x`}
      width={size}
      height={Math.round((size * 3) / 4)}
      alt={`${code} Flagge`}
      loading="lazy"
      className={`inline-block rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ${className}`}
      style={{ width: size, height: Math.round((size * 3) / 4) }}
    />
  );
}
