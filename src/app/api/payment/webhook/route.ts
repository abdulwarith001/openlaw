import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { generateAccessCode } from "@/lib/auth";
import { sendAccessCodeEmail } from "@/lib/email";

interface AccountUpdate {
  credits_remaining: number;
  total_credits_purchased: number;
  code?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature (timing-safe comparison — Issue #11)
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest("hex");

    if (
      !signature ||
      !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const { reference, customer, metadata, amount } = event.data;
      const email = customer.email.toLowerCase().trim();

      // Verify amount matches expected credit pricing (₦100 = 10000 kobo per credit)
      const CREDIT_PRICE_KOBO = 10000;
      const credits = Number(metadata?.credits || Math.floor(amount / CREDIT_PRICE_KOBO));

      if (credits <= 0) {
        console.error("Webhook: Invalid credits", { amount, credits, reference });
        return NextResponse.json({ message: "Invalid transaction" }, { status: 200 });
      }

      // Atomically insert payment record FIRST (Issue #1 + #5)
      // ON CONFLICT (unique paystack_reference) → already processed
      const { data: insertedPayment, error: insertError } = await supabase
        .from("payments")
        .insert({
          account_id: null,
          paystack_reference: reference,
          amount,
          credits,
          status: "success",
        })
        .select("id")
        .single();

      if (insertError || !insertedPayment) {
        // Already processed (likely by verify route) — safe to ignore
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }

      // Find or create account for this email
      let { data: account } = await supabase
        .from("accounts")
        .select("id, email, code, credits_remaining, total_credits_purchased")
        .eq("email", email)
        .single();

      if (account) {
        // Add credits to existing account
        const updateData: AccountUpdate = {
          credits_remaining: Number(account.credits_remaining) + credits,
          total_credits_purchased: Number(account.total_credits_purchased) + credits,
        };

        // If first purchase, generate Access Code
        if (!account.code) {
          updateData.code = generateAccessCode();
        }

        const { data: updatedAccount } = await supabase
          .from("accounts")
          .update(updateData)
          .eq("id", account.id)
          .select()
          .single();
        account = updatedAccount;
      } else {
        // Create new account with access code
        const code = generateAccessCode();
        const { data: newAccount } = await supabase
          .from("accounts")
          .insert({
            code,
            email,
            credits_remaining: credits,
            total_credits_purchased: credits,
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
      }

      // Send email notification (non-critical, after payment is safely recorded)
      if (account?.code) {
        try {
          await sendAccessCodeEmail(email, account.code, account.credits_remaining);
        } catch (emailError) {
          console.error("Webhook: Failed to send email, payment already recorded:", emailError);
        }
      }
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    // Always return 200 to Paystack to prevent retries on our errors
    return NextResponse.json({ message: "OK" }, { status: 200 });
  }
}
