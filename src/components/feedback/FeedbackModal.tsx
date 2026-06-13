import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { submitFeedback, type FeedbackRating } from "@/lib/feedback";
import { haptics } from "@/lib/haptics";

export function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const handlePick = (rating: FeedbackRating) => {
    haptics.tap();
    void submitFeedback(rating);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl border-primary/30 bg-card/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="text-lg text-center">
            Wie gefällt dir KickTime 2026?
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 pt-2">
          <FeedbackButton emoji="👎" label="Schlecht" onClick={() => handlePick(-1)} />
          <FeedbackButton emoji="😐" label="Geht so" onClick={() => handlePick(0)} />
          <FeedbackButton emoji="👍" label="Super" onClick={() => handlePick(1)} />
        </div>
        <p className="text-[10px] text-muted-foreground text-center pt-1">
          Anonym · hilft uns, die App zu verbessern
        </p>
      </DialogContent>
    </Dialog>
  );
}

function FeedbackButton({
  emoji,
  label,
  onClick,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background/60 py-4 active:scale-95 transition-transform hover:bg-primary/10 hover:border-primary/40"
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
