import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ScanHistoryItem, FoodProduct, GlycemicResult, PersonalizedAssessment } from "@/types";

export async function fetchScanHistory(userId: string): Promise<ScanHistoryItem[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("scan_history")
    .select("*")
    .eq("user_id", userId)
    .order("scanned_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    product: {
      name: row.product_name,
      brand: row.product_brand || undefined,
      nutrition: row.nutrition as FoodProduct["nutrition"],
      ingredients: row.ingredients || undefined,
      source: (row.product_source as FoodProduct["source"]) || "search",
    },
    result: row.result as GlycemicResult,
    assessment: row.assessment as PersonalizedAssessment | undefined,
    timestamp: new Date(row.scanned_at).getTime(),
    date: new Date(row.scanned_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  }));
}

export async function addScanToHistory(
  userId: string,
  product: FoodProduct,
  result: GlycemicResult,
  assessment?: PersonalizedAssessment
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("scan_history")
    .insert({
      user_id: userId,
      product_name: product.name,
      product_brand: product.brand || null,
      product_source: product.source,
      nutrition: product.nutrition,
      ingredients: product.ingredients || null,
      result,
      assessment: assessment || null,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function deleteScanFromHistory(
  userId: string,
  scanId: string
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("scan_history")
    .delete()
    .eq("id", scanId)
    .eq("user_id", userId);

  return !error;
}

export async function clearAllHistory(userId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("scan_history")
    .delete()
    .eq("user_id", userId);

  return !error;
}
