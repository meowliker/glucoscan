import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserSettings, BloodSugarUnit } from "@/types";

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    bloodSugarUnit: (data.blood_sugar_unit as BloodSugarUnit) || "mg/dL",
    onboardingComplete: data.onboarding_complete ?? false,
    disclaimerAccepted: data.disclaimer_accepted ?? false,
  };
}

export async function updateUserSettings(
  userId: string,
  updates: Partial<{
    bloodSugarUnit: BloodSugarUnit;
    onboardingComplete: boolean;
    disclaimerAccepted: boolean;
  }>
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.bloodSugarUnit !== undefined) dbUpdates.blood_sugar_unit = updates.bloodSugarUnit;
  if (updates.onboardingComplete !== undefined) dbUpdates.onboarding_complete = updates.onboardingComplete;
  if (updates.disclaimerAccepted !== undefined) dbUpdates.disclaimer_accepted = updates.disclaimerAccepted;

  const { error } = await supabase
    .from("user_settings")
    .update(dbUpdates)
    .eq("user_id", userId);

  return !error;
}
