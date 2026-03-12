import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { ttsLimiter, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Fix 1: Enforce Rate Limiting
    const ip = getClientIP(req.headers);
    try {
      await ttsLimiter.consume(ip);
    } catch {
      return NextResponse.json({ error: "Too many TTS requests. Please slow down." }, { status: 429 });
    }

    // Fix 1: Require Authentication
    const auth = await checkAuth();
    if (auth.status === "none") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    // Prevent abuse from accounts that have exhausted their credits/questions
    if (
      (auth.status === "paid" && auth.credits <= 0) || 
      (auth.status === "free" && auth.questionsUsed >= Number(process.env.NEXT_PUBLIC_FREE_CREDITS || 0))
    ) {
      return NextResponse.json({ error: "No credits remaining" }, { status: 402 });
    }

    const { text, voice = "Idera" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.YARNGPT_API_KEY;
    if (!apiKey) {
      console.warn("YARNGPT_API_KEY is not set in environment variables.");
      return NextResponse.json({ error: "TTS Service not configured" }, { status: 503 });
    }

    const response = await fetch("https://yarngpt.ai/api/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text: text.slice(0, 2000), // YarnGPT limit
        voice,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || "YarnGPT API error" }, { status: response.status });
    }

    // Proxy the audio stream
    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("TTS Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
