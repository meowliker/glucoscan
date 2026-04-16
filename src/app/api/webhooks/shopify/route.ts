import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://glucoscan-cyan.vercel.app";

/**
 * Generate a random 8-char alphanumeric token (excludes ambiguous chars like 0/O, 1/l)
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
  if (!SHOPIFY_WEBHOOK_SECRET) return false;
  const hash = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(body, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
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

    // Send credentials email using Supabase Edge Function or direct SMTP
    // For Supabase built-in: we trigger a password recovery email which the
    // user can use as their "welcome" email. But this doesn't include the token.
    //
    // BETTER APPROACH: Send a custom email via Supabase Auth's invite flow.
    // The invite email template (customizable in Supabase Dashboard) can include
    // the user's metadata. We pass the token in metadata and reference it
    // in the email template.

    // Generate a magic link they can also use (optional, as backup)
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: customerEmail,
      options: {
        redirectTo: `${APP_URL}/auth/callback`,
      },
    });

    // Store the token in the user's profile for reference
    if (newUser.user) {
      await supabase.from("profiles").upsert({
        id: newUser.user.id,
        email: customerEmail,
        full_name: customerName,
      });
    }

    // Log for admin reference
    console.log(
      `[Shopify Webhook] Created user: ${customerEmail}, token: ${token}, userId: ${newUser.user?.id}`
    );

    // Now send the welcome email with credentials
    // Using Supabase's built-in invite email (customizable in dashboard)
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
      // Token is logged server-side only — never sent in response
    });
  } catch (err) {
    console.error("Shopify webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
