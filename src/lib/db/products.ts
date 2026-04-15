import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FoodProduct, NutritionData } from "@/types";

export interface SavedProduct {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  nutrition: NutritionData;
  ingredients?: string;
  lookupCount: number;
}

/**
 * Build a normalized search key for deduplication.
 * Combines brand + name, lowercased, with non-alphanumerics removed.
 */
export function buildSearchKey(name: string, brand?: string): string {
  const combined = `${brand || ""} ${name}`.toLowerCase();
  return combined.replace(/[^a-z0-9]+/g, "").trim();
}

/**
 * Search the shared products table for suggestions matching a query.
 * Uses case-insensitive partial matching on name and brand.
 */
export async function searchProductsInDb(query: string, limit = 5): Promise<SavedProduct[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !query.trim()) return [];

  const q = query.trim().toLowerCase();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
    .order("lookup_count", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    brand: row.brand || undefined,
    category: row.category || undefined,
    nutrition: row.nutrition as NutritionData,
    ingredients: row.ingredients || undefined,
    lookupCount: row.lookup_count || 1,
  }));
}

/**
 * Save a successfully looked-up product to the shared products table.
 * Uses an upsert on the search_key — if the product already exists,
 * increments its lookup_count instead of creating a duplicate.
 */
export async function saveProductToDb(
  userId: string,
  product: FoodProduct
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const searchKey = buildSearchKey(product.name, product.brand);
  if (searchKey.length < 3) return null;

  // Try to find existing product
  const { data: existing } = await supabase
    .from("products")
    .select("id, lookup_count")
    .eq("search_key", searchKey)
    .maybeSingle();

  if (existing) {
    // Increment lookup count
    await supabase
      .from("products")
      .update({
        lookup_count: (existing.lookup_count || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return existing.id;
  }

  // Insert new product
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      brand: product.brand || null,
      category: null,
      nutrition: product.nutrition,
      ingredients: product.ingredients || null,
      search_key: searchKey,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

/**
 * Convert a SavedProduct into a FoodProduct for display/calculation.
 */
export function savedProductToFoodProduct(saved: SavedProduct): FoodProduct {
  return {
    name: saved.name,
    brand: saved.brand,
    nutrition: saved.nutrition,
    ingredients: saved.ingredients,
    source: "search",
  };
}
