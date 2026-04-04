import { NextRequest, NextResponse } from "next/server";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export async function POST(request: NextRequest) {
  if (!CLAUDE_API_KEY) {
    return NextResponse.json(
      { error: "Claude API not configured", demo: true, response: getDemoResponse() },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();
    const { productName, nutrition, impactScore, impactLevel, ingredients } = body;

    const prompt = `You are a nutrition information assistant for a glycemic impact estimation app. The user scanned a food product. Provide a brief, helpful insight about this food's estimated glycemic impact.

IMPORTANT RULES:
- NEVER use words: safe, unsafe, dangerous, will, guaranteed, clinically, cure, treat, manage, prevent
- ALWAYS use: estimated, may, based on nutritional profile, general information, consult your healthcare provider
- Keep response to 2-3 sentences maximum
- Be factual and helpful, not alarmist
- This is general nutritional information, not medical advice

Product: ${productName}
${ingredients ? `Key Ingredients: ${ingredients}` : ""}
Nutrition per 100g: Carbs ${nutrition.totalCarbs}g, Fiber ${nutrition.fiber}g, Fat ${nutrition.fat}g, Protein ${nutrition.protein}g
Estimated Impact Score: ${impactScore}/10 (${impactLevel})

Provide a brief nutritional insight about this food's estimated glycemic impact and one practical tip:`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Claude API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Claude API error", demo: true, response: getDemoResponse() },
        { status: 200 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || getDemoResponse();

    return NextResponse.json({ response: text, demo: false });
  } catch {
    return NextResponse.json(
      { error: "Failed to get AI insight", demo: true, response: getDemoResponse() },
      { status: 200 }
    );
  }
}

function getDemoResponse(): string {
  return "Based on the nutritional profile, this food's estimated glycemic impact has been calculated using available ingredient and nutrition data. For personalized dietary guidance, please consult your healthcare provider or a registered dietitian.";
}
