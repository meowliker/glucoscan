import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.gainedfocus.com";
// Comma-separated list of Shopify product IDs that grant GlucoScan access
const GLUCOSCAN_PRODUCT_IDS = process.env.GLUCOSCAN_PRODUCT_IDS || "";

/**
 * Generate a random 8-char alphanumeric token (excludes ambiguous chars)
 */
function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
}

/**
 * Verify Shopify webhook HMAC signature
 */
function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.error("Shopify webhook: SHOPIFY_WEBHOOK_SECRET is not set");
    return false;
  }

  // Trim any whitespace that may have been added when storing the secret
  const secret = SHOPIFY_WEBHOOK_SECRET.trim();

  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  const expectedBuf = Buffer.from(hash);
  const receivedBuf = Buffer.from(hmacHeader);

  // timingSafeEqual throws if buffers have different lengths
  if (expectedBuf.length !== receivedBuf.length) {
    console.error(
      `Shopify webhook: HMAC length mismatch. Expected ${expectedBuf.length}, got ${receivedBuf.length}`
    );
    return false;
  }

  try {
    const valid = crypto.timingSafeEqual(expectedBuf, receivedBuf);
    if (!valid) {
      console.error(
        `Shopify webhook: HMAC mismatch. Expected: ${hash}, Received: ${hmacHeader}`
      );
    }
    return valid;
  } catch (err) {
    console.error("Shopify webhook: HMAC comparison error:", err);
    return false;
  }
}

/**
 * Check if the order contains the GlucoScan upsell product
 */
function orderContainsGlucoScan(order: {
  line_items?: Array<{
    product_id?: number;
    title?: string;
    name?: string;
  }>;
}): boolean {
  if (!order.line_items || order.line_items.length === 0) return false;

  // If no product IDs configured, check by product name containing "glucoscan"
  if (!GLUCOSCAN_PRODUCT_IDS) {
    return order.line_items.some(
      (item) =>
        (item.title || "").toLowerCase().includes("glucoscan") ||
        (item.name || "").toLowerCase().includes("glucoscan")
    );
  }

  // Check by product ID
  const allowedIds = GLUCOSCAN_PRODUCT_IDS.split(",").map((id) =>
    id.trim()
  );
  return order.line_items.some(
    (item) =>
      item.product_id && allowedIds.includes(String(item.product_id))
  );
}

/**
 * Get Supabase admin client (service_role key — server-side only)
 */
function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Verify Shopify HMAC
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    if (!hmacHeader || !verifyShopifyWebhook(rawBody, hmacHeader)) {
      console.error("Shopify webhook: Invalid HMAC");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = JSON.parse(rawBody);

    // Check if this order contains the GlucoScan product
    if (!orderContainsGlucoScan(order)) {
      console.log("[Shopify Webhook] Order does not contain GlucoScan product, skipping");
      return NextResponse.json({ status: "skipped", reason: "no_glucoscan_product" });
    }

    const customerEmail = order.customer?.email || order.email;
    const customerName =
      `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim();

    if (!customerEmail) {
      return NextResponse.json({ error: "No customer email" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(
      (u) => u.email === customerEmail
    );

    if (alreadyExists) {
      console.log(`[Shopify Webhook] User ${customerEmail} already exists, skipping`);
      return NextResponse.json({ status: "existing_user" });
    }

    // Generate 8-char token as temporary password
    const token = generateToken();

    // Create user with token as password — email auto-confirmed
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: customerEmail,
        password: token,
        email_confirm: true,
        user_metadata: {
          full_name: customerName,
          source: "shopify",
          should_change_password: true,
        },
      });

    if (createError) {
      console.error("Failed to create user:", createError.message);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Store profile
    if (newUser.user) {
      await supabase.from("profiles").upsert({
        id: newUser.user.id,
        email: customerEmail,
        full_name: customerName,
      });
    }

    console.log(
      `[Shopify Webhook] Created user: ${customerEmail}, token: ${token}, userId: ${newUser.user?.id}`
    );

    // Send welcome email with credentials via Supabase invite
    await supabase.auth.admin.inviteUserByEmail(customerEmail, {
      data: {
        full_name: customerName,
        access_token: token,
        app_url: APP_URL,
      },
    });

    return NextResponse.json({
      status: "created",
      email: customerEmail,
      userId: newUser.user?.id,
    });
  } catch (err) {
    console.error("Shopify webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
