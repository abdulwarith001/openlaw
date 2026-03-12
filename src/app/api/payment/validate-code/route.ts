import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { setAccountCookie } from "@/lib/auth";
import { codeValidateLimiter, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers);

    // Rate limit: 5 code validation attempts per IP per 10 minutes
    try {
      await codeValidateLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { code, email } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Access code is required" }, { status: 400 });
    }

    const normalizedCode = code.toUpperCase().trim();
    const normalizedEmail = email?.toLowerCase().trim();

    // Validate format: KTL-XXXX-XXXX
    if (!/^KTL-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(normalizedCode)) {
      return NextResponse.json({ error: "Invalid access code format" }, { status: 400 });
    }

    let query = supabase
      .from("accounts")
      .select("id, code, credits_remaining, is_active, email, session_version")
      .eq("code", normalizedCode)
      .eq("is_active", true);

    // If email is provided, verify it matches
    if (normalizedEmail) {
      query = query.eq("email", normalizedEmail);
    }

    const { data: account } = await query.single();

    if (!account) {
      return NextResponse.json({ error: "Invalid access code" }, { status: 400 });
    }

    // Update last_used_at
    await supabase
      .from("accounts")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", account.id);

    // Set unified session cookie
    await setAccountCookie(account.id, account.session_version || 1);

    return NextResponse.json({
      valid: true,
      credits_remaining: account.credits_remaining,
      email: account.email
    });
  } catch (error) {
    console.error("Validate Code Error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
