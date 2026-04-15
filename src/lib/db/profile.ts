import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  diabetesType: "type_1" | "type_2" | "gestational" | "prediabetes" | "other" | null;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email ?? null,
    fullName: data.full_name ?? null,
    avatarUrl: data.avatar_url ?? null,
    dateOfBirth: data.date_of_birth ?? null,
    diabetesType: data.diabetes_type ?? null,
  };
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    fullName: string;
    avatarUrl: string;
    dateOfBirth: string;
    diabetesType: UserProfile["diabetesType"];
  }>
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth;
  if (updates.diabetesType !== undefined) dbUpdates.diabetes_type = updates.diabetesType;

  const { error } = await supabase
    .from("profiles")
    .update(dbUpdates)
    .eq("id", userId);

  return !error;
}
