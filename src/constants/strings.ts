export const DISCLAIMER_TEXT =
  "GlucoScan provides general nutritional information only. It is not a medical device and does not provide medical advice. Always consult your doctor or dietitian before making dietary decisions based on this app.";

export const RESULT_DISCLAIMER =
  "\u2139\ufe0f For informational purposes only. Not medical advice.";

export const IMPACT_LABELS = {
  low: "Low Impact",
  moderate: "Moderate Impact",
  high: "High Impact",
} as const;

export const IMPACT_DESCRIPTIONS = {
  low: "This food has an estimated low glycemic impact based on its nutritional profile.",
  moderate:
    "This food has an estimated moderate glycemic impact. Consider portion size.",
  high: "This food has an estimated high glycemic impact based on its nutritional profile. Consult your healthcare provider.",
} as const;

export const BG_MESSAGES = {
  highBgHighFood:
    "Your current blood sugar reading is elevated. This food has an estimated high glycemic impact. Consider consulting your healthcare provider.",
  highBgMedFood:
    "Your current blood sugar reading is elevated. Even moderate glycemic impact foods may require extra consideration. Consult your healthcare provider.",
  highBgLowFood:
    "Your current blood sugar reading is elevated, but this food has an estimated low glycemic impact based on its nutritional profile.",
  normalBg:
    "Your current blood sugar reading is within a typical range for this assessment.",
  lowBg:
    "Your current blood sugar reading is within a lower range. Standard glycemic thresholds apply for this assessment.",
} as const;

export const APP_NAME = "GlucoScan";
export const APP_VERSION = "1.0.0";
export const APP_DESCRIPTION =
  "Estimate the glycemic impact of packaged foods by scanning barcodes or searching by name.";
