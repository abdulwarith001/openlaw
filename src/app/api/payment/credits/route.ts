import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";

const FREE_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_CREDITS || 0);

export async function GET() {
  try {
    const auth = await checkAuth();

    if (auth.status === "paid") {
      return NextResponse.json({
        type: "paid",
        credits_remaining: auth.credits,
        email: auth.email,
        code: auth.code,
      });
    }

    if (auth.status === "free") {
      return NextResponse.json({
        type: "free",
        questions_remaining: Math.max(0, FREE_LIMIT - auth.questionsUsed),
        questions_used: auth.questionsUsed,
        email: auth.email,
      });
    }

    return NextResponse.json({ type: "none" });
  } catch (error) {
    console.error("Credits Check Error:", error);
    return NextResponse.json({ type: "none" });
  }
}
