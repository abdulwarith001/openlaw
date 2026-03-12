import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import constitutionData from "@/data/vector_constitution.json";
import embeddingsData from "@/data/embeddings.json";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const latestMessage = messages[messages.length - 1].content;

    // Vector Search
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage as string,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Calculate dot product (cosine similarity since OpenAI embeddings are normalized)
    const scoredSections = (embeddingsData as any[]).map((doc: any) => {
      const similarity = doc.embedding.reduce((acc: number, val: number, i: number) => acc + val * queryEmbedding[i], 0);
      return { ...doc, similarity };
    });

    // Sort and get top 5
    // Sort and get top 8 for better context variety
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

    // Determine if we found enough relevant context
    const hasContext = topSections.length > 0;
    const context = hasContext 
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
      temperature: 0, // Zero temperature for maximum factual consistency
    });

    const content = completion.choices[0].message.content;

    return NextResponse.json({ content });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
