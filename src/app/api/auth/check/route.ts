import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { authCheckLimiter, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 per IP per minute (Issue #2)
    const ip = getClientIP(req.headers);
    try {
      await authCheckLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if account exists
    const { data: account } = await supabase
      .from("accounts")
      .select("code")
      .eq("email", normalizedEmail)
      .single();

    if (account?.code) {
      return NextResponse.json({ status: "EXISTING_PAID" });
    }

    // Return same-shaped response for NEW and EXISTING_FREE
    // Distinguished so PaywallModal can route free users to OTP re-verify
    return NextResponse.json({ status: account ? "EXISTING_FREE" : "NEW" });
  } catch (error) {
    console.error("Check Email Error:", error);
    return NextResponse.json({ error: "Failed to check email status" }, { status: 500 });
  }
}
