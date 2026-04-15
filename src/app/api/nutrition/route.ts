import { NextRequest, NextResponse } from "next/server";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export async function POST(request: NextRequest) {
  if (!CLAUDE_API_KEY) {
    return NextResponse.json(
      { error: "Claude API not configured" },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();
    const { productName, brand } = body;

    if (!productName) {
      return NextResponse.json(
        { error: "No product name provided" },
        { status: 400 }
      );
    }

    const fullName = brand ? `${brand} ${productName}` : productName;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `You are a nutrition database. Given a user's search query, identify the correct food product and return its accurate nutritional information per 100g (or per 100ml for beverages).

User's query: "${fullName}"

STEP 1 — IDENTIFY THE CORRECT PRODUCT:
The user may have entered a misspelled name, a partial name, a nickname, or a rough description. Use your knowledge to figure out what specific product they most likely mean and return its CANONICAL (correct, complete) name.

Examples:
- "kurkure" → "Kurkure Masala Munch" (most popular variant, brand: Kurkure)
- "kurkre masla mnch" (misspelled) → "Kurkure Masala Munch"
- "maggi" → "Maggi 2-Minute Noodles (Masala)"
- "cock" or "coka cola" → "Coca-Cola" (brand: Coca-Cola)
- "parle g" → "Parle-G Biscuits" (brand: Parle)
- "choclate chip cooky" → "Chocolate Chip Cookies"
- "thums up" → "Thums Up Cola"

If the query is too ambiguous (e.g. just "snack" or "drink"), pick the most common interpretation or return null in productName.

STEP 2 — RETURN NUTRITION DATA:
Research the identified product and return accurate nutrition per 100g (or 100ml for beverages). Use your knowledge of the exact brand/product if known, otherwise the typical nutritional profile.

Return ONLY a JSON object:
{
  "productName": "CORRECTED canonical product name (e.g. 'Kurkure Masala Munch'), NOT the user's raw query",
  "brand": "brand name or null",
  "category": "e.g. Snack, Beverage, Biscuit, Supplement, Dairy, Cereal, etc.",
  "nutrition": {
    "calories": number per 100g,
    "totalCarbs": number per 100g,
    "sugar": number per 100g,
    "fiber": number per 100g,
    "fat": number per 100g,
    "protein": number per 100g,
    "sodium": number in mg per 100g or 0
  },
  "ingredients": "key ingredients comma-separated",
  "confidence": "high" or "medium" or "low",
  "correctedFromQuery": boolean (true if the canonical name differs from the user's query),
  "note": "brief note about the product, e.g. 'Popular Indian corn-based snack by PepsiCo'"
}

IMPORTANT RULES:
- ALWAYS return the CANONICAL product name in "productName", NEVER the user's raw (possibly misspelled) query.
- For well-known products like Kurkure, Maggi, Parle-G, Coca-Cola, Oreo, Lays, etc. you should know exact values.
- For less known products, provide your best estimate and set confidence to "medium" or "low".
- Values must be per 100g or 100ml, NOT per serving.
- Return ONLY valid JSON, no other text.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Claude API error:", response.status);
      return NextResponse.json({ error: "AI lookup failed" }, { status: 200 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          success: true,
          ...parsed,
        });
      }
    } catch {
      // JSON parse failed
    }

    return NextResponse.json({ error: "Could not parse nutrition data" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to look up nutrition" }, { status: 200 });
  }
}
