import { NextRequest, NextResponse } from "next/server";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export async function POST(request: NextRequest) {
  if (!CLAUDE_API_KEY) {
    return NextResponse.json(
      { error: "Claude API not configured", productName: null },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided", productName: null },
        { status: 400 }
      );
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: `You are a food product identifier. Analyze this image carefully.

STEP 1: Read the product name, brand, and any visible nutrition information from the packaging.
STEP 2: If you can see a nutrition facts table/label on the packaging, READ THE EXACT VALUES from it.
STEP 3: If no nutrition label is visible, use your knowledge of this specific commercial product to estimate nutrition per 100g/100ml. Think about what this product actually contains — ingredients, flavorings, added sugars, maltodextrin, etc.

Return ONLY a JSON object:
{
  "productName": "exact product name from packaging",
  "brand": "brand name or null",
  "category": "e.g. Beverage, Snack, Supplement, Biscuit, Dairy, etc.",
  "nutritionSource": "label" or "estimated",
  "nutrition": {
    "totalCarbs": number per 100g,
    "fiber": number per 100g,
    "fat": number per 100g,
    "protein": number per 100g,
    "sugar": number per 100g,
    "calories": number per 100g or 0 if unknown
  },
  "ingredients": "comma-separated key ingredients if visible on packaging, or your best guess for this product",
  "searchQueries": [
    "most specific: exact brand + product name e.g. 'muscleblaze creatine monohydrate'",
    "moderate: brand + generic type e.g. 'muscleblaze supplement'",
    "generic: just the product type e.g. 'creatine monohydrate powder'",
    "broader: category search e.g. 'creatine supplement'",
    "broadest: simple category e.g. 'protein supplement'"
  ]
}

IMPORTANT:
- LOOK CAREFULLY at the image for a nutrition facts table or label. If you can see ANY numbers on the packaging (calories, carbs, protein, fat, etc.), READ AND USE THOSE EXACT VALUES. Convert to per 100g if the label shows per serving.
- If you cannot see a nutrition label, estimate based on your knowledge of this SPECIFIC commercial product. DO NOT return all zeros — every commercial product has some nutritional content per 100g.
- The searchQueries should go from MOST SPECIFIC to MOST GENERIC — we will try them in order until we find a match in the Open Food Facts database.
- Return ONLY valid JSON, no other text.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Claude Vision API error:", response.status);
      return NextResponse.json(
        { error: "Vision API error", productName: null },
        { status: 200 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          productName: parsed.productName || null,
          brand: parsed.brand || null,
          category: parsed.category || null,
          nutritionSource: parsed.nutritionSource || "estimated",
          nutrition: parsed.nutrition || null,
          ingredients: parsed.ingredients || null,
          searchQueries: parsed.searchQueries || [parsed.productName],
        });
      }
    } catch {
      // JSON parse failed
    }

    return NextResponse.json({
      productName: text.trim().slice(0, 100),
      brand: null,
      category: null,
      nutritionSource: "estimated",
      nutrition: null,
      ingredients: null,
      searchQueries: [text.trim().slice(0, 50)],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to identify food", productName: null },
      { status: 200 }
    );
  }
}
