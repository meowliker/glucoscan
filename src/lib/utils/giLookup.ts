import giTable from "@/data/giTable.json";

const giData: Record<string, number> = giTable;

export function lookupGI(ingredientName: string): number | null {
  const normalized = ingredientName.toLowerCase().trim();
  if (giData[normalized] !== undefined) {
    return giData[normalized];
  }
  for (const [key, value] of Object.entries(giData)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  return null;
}

export function estimateGIFromIngredients(ingredientString: string): number {
  if (!ingredientString || ingredientString.trim().length === 0) {
    return 55;
  }

  const ingredients = ingredientString
    .toLowerCase()
    .replace(/\(.*?\)/g, ",")
    .split(/[,;]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);

  if (ingredients.length === 0) return 55;

  let totalWeight = 0;
  let weightedGI = 0;
  let matchCount = 0;

  ingredients.forEach((ingredient, index) => {
    const gi = lookupGI(ingredient);
    if (gi !== null) {
      const weight = Math.max(1, ingredients.length - index);
      weightedGI += gi * weight;
      totalWeight += weight;
      matchCount++;
    }
  });

  if (matchCount === 0) return 55;

  return Math.round(weightedGI / totalWeight);
}
