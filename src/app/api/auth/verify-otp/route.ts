import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { setAccountCookie } from "@/lib/auth";
import { otpVerifyLimiter, getClientIP } from "@/lib/rate-limit";

const MAX_OTP_ATTEMPTS = 5;
const FREE_CREDITS = Number(process.env.NEXT_PUBLIC_FREE_CREDITS || 0);

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers);

    // Rate limit: 5 verify attempts per IP per 15 minutes
    try {
      await otpVerifyLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { email, otp, fingerprint } = await req.json();

    if (!email || !otp || !fingerprint) {
      return NextResponse.json({ error: "Email, OTP, and fingerprint are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up the OTP record
    const { data: otpRecord } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (!otpRecord) {
      return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 });
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase.from("otp_codes").delete().eq("email", normalizedEmail);
      return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
    }

    // Brute-force protection: max 5 wrong attempts per OTP
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await supabase.from("otp_codes").delete().eq("email", normalizedEmail);
      return NextResponse.json({ error: "Too many incorrect attempts. Please request a new code." }, { status: 429 });
    }

    // Verify fingerprint (Fix #5)
    if (otpRecord.fingerprint !== fingerprint) {
      await supabase
        .from("otp_codes")
        .update({ attempts: (otpRecord.attempts || 0) + 1 })
        .eq("email", normalizedEmail);
      return NextResponse.json({ error: "Context validation failed. Please request a new code from this device." }, { status: 400 });
    }

    // Check OTP match
    const otpMatch = crypto.timingSafeEqual(
      Buffer.from(otp.trim().padEnd(6)),
      Buffer.from(otpRecord.otp.padEnd(6))
    );
    if (!otpMatch) {
      await supabase
        .from("otp_codes")
        .update({ attempts: (otpRecord.attempts || 0) + 1 })
        .eq("email", normalizedEmail);
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Double-check account doesn't exist (race condition)
    let { data: account } = await supabase
      .from("accounts")
      .select("id, session_version")
      .eq("email", normalizedEmail)
      .single();

    if (!account) {
      // Create unified account record
      const { data: newAccount, error: insertError } = await supabase
        .from("accounts")
        .insert({ 
          email: normalizedEmail,
          free_questions_used: 0,
          credits_remaining: 0, // Credits only come from purchase or initial free questions
          total_credits_purchased: 0,
          session_version: 1,
        })
        .select("id, session_version")
        .single();

      if (insertError || !newAccount) {
        console.error("Insert account error:", insertError);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      }
      account = newAccount;
    }

    // Clean up OTP
    await supabase.from("otp_codes").delete().eq("email", normalizedEmail);

    // Set unified session cookie
    await setAccountCookie(account.id, account.session_version || 1);

    return NextResponse.json({ 
      success: true, 
      questionsRemaining: FREE_CREDITS 
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
