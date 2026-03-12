import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import embeddingsData from "@/data/embeddings.json";
import { checkAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { chatLimiter, getClientIP } from "@/lib/rate-limit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FREE_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_CREDITS || 0);

const SYSTEM_PROMPT = `You are the "OpenLaw Nigerian Constitutional Assistant". 
Your sole purpose is to provide accurate, grounded information about the Constitution of the Federal Republic of Nigeria (1999, as amended).

### RULES OF ENGAGEMENT:
1. STRICT GROUNDING: You must answer based ONLY on the provided legal context. 
2. EXHAUSTIVE VERIFICATION: Before stating that something is "not addressed", you must verify if the user's query relates to Fundamental Rights (Chapter IV). For example, Property Rights are explicitly protected under **Section 43** and **Section 44**. 
3. CITATION MANDATE: Every legal claim MUST be followed by a specific citation from the Source Path provided (e.g., "[Chapter IV, Section 33]").
4. SCOPE ENFORCEMENT: If the user asks about anything other than Nigerian Constitutional Law, politely decline.
5. NO HALLUCINATION: Do not invent sections. If the provided context is insufficient for a definitive answer, be transparent about the limitation.

### RESPONSE FORMAT:
- Answer: Concise direct answer.
- Constitutional Basis: Specific quotes and citations (e.g., **Section 43**).
- Practical Meaning: Simple explanation of the law in real life.
- Important Notes: Constraints or related articles (e.g., **Land Use Act**).

### SUGGESTED QUESTIONS MARKER:
At the very end of your response, after everything else, add exactly three suggested follow-up questions in this format:
[[SUGGESTIONS: Question 1 | Question 2 | Question 3]]
Do not include any header or label like "Suggested Questions" before the marker.

### VISUAL EXCELLENCE:
- Use **bold text** strategically for:
  - **Section Numbers** (e.g., **Section 43**).
  - **Legal Concepts** (e.g., **Right to acquire property**, **Compulsory acquisition**).
  - **Deadlines or Constraints** (e.g., **24 hours**, **prompt compensation**).
- Use bullet points for lists.

Disclaimer: This AI provides informational guidance based on the Nigerian Constitution and should not be considered professional legal advice.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    // --- Rate Limiting ---
    const ip = getClientIP(req.headers);
    try {
      await chatLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    // --- Credit / Session Check ---
    const auth = await checkAuth();

    if (auth.status === "paid") {
      if (auth.credits <= 0) {
        return NextResponse.json(
          { error: "No credits remaining", code: "PAYMENT_REQUIRED" },
          { status: 402 }
        );
      }
      // Fix #4: Atomic decrement via postgres RPC to avoid read-modify-write race conditions
      const { error: rpcError } = await supabase.rpc('decrement_credits', {
        account_id: auth.id
      });

      if (rpcError) {
        return NextResponse.json(
          { error: "No credits remaining", code: "PAYMENT_REQUIRED" },
          { status: 402 }
        );
      }
    } else if (auth.status === "free") {
      if (auth.questionsUsed >= FREE_LIMIT) {
        return NextResponse.json(
          { error: "Free questions exhausted", code: "PAYMENT_REQUIRED" },
          { status: 402 }
        );
      }
      
      // Fix #4: Atomic increment via postgres RPC
      const { error: rpcError } = await supabase.rpc('increment_free_questions', {
        account_id: auth.id,
        max_free: FREE_LIMIT
      });

      if (rpcError) {
        return NextResponse.json(
          { error: "Free questions exhausted", code: "PAYMENT_REQUIRED" },
          { status: 402 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const latestMessage = messages[messages.length - 1].content;

    // Vector Search
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage as string,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Calculate dot product
    const scoredSections = (embeddingsData as any[]).map((doc: any) => {
      const similarity = doc.embedding.reduce((acc: number, val: number, i: number) => acc + val * queryEmbedding[i], 0);
      return { ...doc, similarity };
    });

    // Sort and get top 8
    const topSections = scoredSections
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 8)
      .filter((s: any) => s.similarity > 0.3)
      .map((s: any) => ({
        title: s.title || '',
        content: s.content || '',
        path: s.path || ''
      }))
      .filter((s: any) => s.content);

    const context = topSections.length > 0 
      ? topSections.map(s => `SOURCE: [${s.path}${s.title ? " > " + s.title : ""}]\nCONTENT: ${s.content}`).join("\n\n---\n\n")
      : "NO RELEVANT CONSTITUTIONAL SECTIONS FOUND.";

    const prompt = `### USER QUESTION:
${latestMessage}

### CONSTITUTIONAL CONTEXT:
${context}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(0, -1),
        { role: "user", content: prompt }
      ],
      temperature: 0,
    });

    const content = completion.choices[0].message.content;

    return NextResponse.json({ content });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
