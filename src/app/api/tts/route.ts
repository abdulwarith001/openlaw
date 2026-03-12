import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "Idera" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.YARNGPT_API_KEY;
    if (!apiKey) {
      // For now, if no API key, return a mock error or placeholder
      // In a real scenario, this would be a 500 or 401
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
