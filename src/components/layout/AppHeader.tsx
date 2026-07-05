import { Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/app-store";

export function AppHeader() {
  const spoiler = useAppStore((s) => s.spoilerProtection);
  const setSpoiler = useAppStore((s) => s.setSpoiler);
  return (
    <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 backdrop-blur px-4">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="KickTime Logo" className="h-7 w-7 rounded-md object-cover" />
        <div className="text-base font-bold tracking-tight">
          Kick<span className="text-primary">Time</span> 2026
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        {spoiler ? (
          <EyeOff className="h-4 w-4 text-accent" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-[11px] font-medium text-muted-foreground">
          Spoilerschutz
        </span>
        <Switch checked={spoiler} onCheckedChange={setSpoiler} className="data-[state=unchecked]:bg-destructive" />
      </label>
    </header>
  );
}
