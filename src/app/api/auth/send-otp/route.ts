import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import { generateOTP } from "@/lib/auth";
import { otpSendLimiter, otpEmailLimiter, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers);

    // Rate limit by IP: 3 OTP requests per 15 minutes
    try {
      await otpSendLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, fingerprint } = await req.json();

    if (!email || !fingerprint) {
      return NextResponse.json({ error: "Email and fingerprint are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit by email: 2 requests per 10 minutes
    try {
      await otpEmailLimiter.consume(normalizedEmail);
    } catch {
      return NextResponse.json(
        { error: "Verification code already sent. Please check your email or wait a few minutes." },
        { status: 429 }
      );
    }

    // Check if account already exists
    const { data: account } = await supabase
      .from("accounts")
      .select("id, code")
      .eq("email", normalizedEmail)
      .single();

    if (account?.code) {
      // Paid users should use their access code
      return NextResponse.json(
        { error: "This email is associated with a paid account. Please use your access code to log in." },
        { status: 403 }
      );
    }
    // Existing free users (or new users) can proceed with OTP verification
    // verify-otp will re-establish the session without granting new free credits

    // Generate and store OTP (with 10 minute expiry)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase
      .from("otp_codes")
      .upsert(
        { email: normalizedEmail, otp, fingerprint, expires_at: expiresAt, attempts: 0 },
        { onConflict: "email" }
      );

    // Send OTP email
    await resend.emails.send({
      from: "OpenLaw <noreply@notifications.openlaw.live>",
      to: normalizedEmail,
      subject: "Your OpenLaw Verification Code",
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0B0B0F; color: #E6E6F0;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #E6E6F0;">OpenLaw</h1>
          <p style="color: #9A9AAF; margin-bottom: 32px;">Nigerian Constitutional Legal Assistant</p>
          <div style="background: #12121A; border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 32px; text-align: center;">
            <p style="color: #9A9AAF; margin-bottom: 16px;">Your verification code is:</p>
            <h2 style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4F7CFF; margin: 0;">${otp}</h2>
            <p style="color: #9A9AAF; margin-top: 16px; font-size: 14px;">This code expires in 10 minutes.</p>
          </div>
          <p style="color: #9A9AAF; font-size: 12px; margin-top: 24px; text-align: center;">
            You're receiving this because someone requested free access to OpenLaw with this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
