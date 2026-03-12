import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateAccessCode, setAccountCookie } from "@/lib/auth";
import { sendAccessCodeEmail } from "@/lib/email";
import { paymentVerifyLimiter, getClientIP } from "@/lib/rate-limit";

interface AccountUpdate {
  credits_remaining: number;
  total_credits_purchased: number;
  code?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 attempts per IP per 10 minutes (Issue #3)
    const ip = getClientIP(req.headers);
    try {
      await paymentVerifyLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    // Verify with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!data.status || data.data.status !== "success") {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    const email = data.data.customer.email.toLowerCase().trim();
    const credits = Number(data.data.metadata?.credits || Math.floor(data.data.amount / 10000));

    // Atomically insert payment record FIRST (Issue #1)
    // ON CONFLICT (unique paystack_reference) → already processed
    const { data: insertedPayment, error: insertError } = await supabase
      .from("payments")
      .insert({
        account_id: null,
        paystack_reference: reference,
        amount: data.data.amount,
        credits,
        status: "success",
      })
      .select("id")
      .single();

    let account = null;

    if (!insertError && insertedPayment) {
      // Payment not yet processed — handle credit updates
      let { data: existingAccount } = await supabase
        .from("accounts")
        .select("id, email, code, credits_remaining, total_credits_purchased, session_version")
        .eq("email", email)
        .single();

      if (existingAccount) {
        const updateData: AccountUpdate = {
          credits_remaining: Number(existingAccount.credits_remaining) + credits,
          total_credits_purchased: Number(existingAccount.total_credits_purchased) + credits,
        };

        // If first purchase, generate the unique Access Code
        if (!existingAccount.code) {
          updateData.code = generateAccessCode();
        }

        const { data: updatedAccount } = await supabase
          .from("accounts")
          .update(updateData)
          .eq("id", existingAccount.id)
          .select()
          .single();
        account = updatedAccount;
      } else {
        // Fallback: create account if it doesn't exist (should have been created by OTP)
        const code = generateAccessCode();
        const { data: newAccount } = await supabase
          .from("accounts")
          .insert({
            code,
            email,
            credits_remaining: credits,
            total_credits_purchased: credits,
            session_version: 1,
          })
          .select()
          .single();
        account = newAccount;
      }

      // Update payment record with resolved account_id
      if (account) {
        await supabase
          .from("payments")
          .update({ account_id: account.id })
          .eq("id", insertedPayment.id);

        // Send email notification (only on successful new payment)
        if (account.code) {
          try {
            await sendAccessCodeEmail(email, account.code, account.credits_remaining);
          } catch (emailError) {
            console.error("Verify: Failed to send email, payment already recorded:", emailError);
          }
        }
      }
    } else {
      // Already processed (likely by webhook) — just fetch current account state
      const { data: currentAccount } = await supabase
        .from("accounts")
        .select("*")
        .eq("email", email)
        .single();
      account = currentAccount;
    }

    // Set unified session cookie
    if (account) {
      await setAccountCookie(account.id, account.session_version || 1);
    }

    return NextResponse.json({
      access_code: account?.code,
      credits_remaining: account?.credits_remaining,
      email,
    });
  } catch (error) {
    console.error("Payment Verify Error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
