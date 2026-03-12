import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { paymentInitLimiter, getClientIP } from "@/lib/rate-limit";

const CREDIT_PRICE_KOBO = 10000; // ₦100 = 10000 kobo
const VALID_PACKS: Record<number, number> = { 5: 50000, 10: 100000, 25: 250000 };

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers);

    // Rate limit: 5 payment attempts per IP per 10 minutes
    try {
      await paymentInitLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Too many payment attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { email, credits } = await req.json();

    if (!email || !credits) {
      return NextResponse.json({ error: "Email and credit amount are required" }, { status: 400 });
    }

    // Fix #3: Strict input validation for credit packs
    if (typeof credits !== "number" || !VALID_PACKS[credits]) {
      return NextResponse.json({ error: "Invalid credit pack. Choose 5, 10, or 25." }, { status: 400 });
    }
    const expectedAmount = VALID_PACKS[credits];

    const reference = `OL-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        amount: expectedAmount,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/success`,
        metadata: {
          credits,
          custom_fields: [
            {
              display_name: "Credit Pack",
              variable_name: "credits",
              value: `${credits} credits`,
            },
          ],
        },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || "Payment initialization failed" }, { status: 400 });
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Payment Initialize Error:", error);
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }
}
