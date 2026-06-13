import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device-id";
import { APP_VERSION } from "@/lib/version";

export type FeedbackRating = -1 | 0 | 1;

export async function submitFeedback(rating: FeedbackRating): Promise<void> {
  try {
    const { error } = await supabase.from("app_feedback").insert({
      device_id: getDeviceId(),
      rating,
      app_version: APP_VERSION,
    });
    if (error) {
      console.warn("[feedback] insert failed:", error.message);
    }
  } catch (e) {
    console.warn("[feedback] unexpected error:", e);
  }
}
