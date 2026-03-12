Build a production-ready AI web application that allows users to chat with an AI about Nigerian law and the Nigerian Constitution.

Core Idea

The platform acts as a legal chatbot focused strictly on the Nigerian Constitution and citizen rights. Users should be able to ask questions about laws, rights, and legal interpretations and receive clear, structured explanations.

The AI must prioritize accuracy, clarity, and citations from the Constitution.

Architecture
Frontend

Framework: Next.js (latest stable, App Router)

Pages required:

Landing Page /
Purpose: Explain the product.

Sections:

Hero section explaining the AI legal assistant

Brief explanation of Nigerian constitutional rights

CTA button "Start Chatting" linking to /chat

Section explaining that responses are informational and not legal advice

Chat Page /chat
This is the main product.

Features:

Clean ChatGPT-style interface

Chat window

User input box

Streaming AI responses

Message history

Mobile responsive

Loading indicators

UI Components:

Chat bubble layout

Markdown rendering

Code block styling for legal citations

Section separators for structured responses

AI System
Model Behavior

The AI must behave as a Nigerian constitutional legal assistant.

Rules:

The AI must only answer questions related to Nigerian law, the Nigerian Constitution, or citizens’ rights.

If a user asks something unrelated to Nigerian law, respond:

"I can only assist with questions related to Nigerian law and the Constitution."

The AI must not hallucinate laws.

All answers must reference the specific constitutional section when possible.

Knowledge Source

The agent must load and use the 1999 Constitution of the Federal Republic of Nigeria (as amended).

Implementation:

Download or load the constitution text.

Chunk the document into sections.

Store embeddings in a vector database.

Suggested stack:

Embeddings: OpenAI or open source embeddings

Vector DB: Pinecone / Chroma / Supabase Vector

Use RAG (Retrieval Augmented Generation) so answers come directly from the constitution.

Response Format

Every response must follow this structure:

1. Direct Answer
   Simple explanation in plain English.

2. Constitutional Basis
   Quote or reference the relevant section of the Nigerian Constitution.

Example:

Section 34 — Right to Dignity of Human Person

3. What This Means in Practice
   Explain how this affects citizens in real life.

4. Important Notes
   Clarify limitations or legal interpretations.

Example Response

User Question:
"Can the police torture a suspect?"

Response format:

Answer
No. The Nigerian Constitution prohibits torture and inhumane treatment.

Constitutional Basis
Section 34(1) of the Constitution states that every individual is entitled to dignity and shall not be subjected to torture, inhuman or degrading treatment.

What This Means
Police officers cannot legally torture suspects during interrogation. Evidence obtained through torture may also be challenged in court.

Important Notes
While this protection exists, enforcement depends on reporting abuses and legal action.

Backend

Use a Next.js API route or separate backend.

Responsibilities:

Handle chat requests

Retrieve relevant constitutional sections

Pass them to the LLM

Stream responses back to the frontend

Pipeline:

User message →
Embedding search →
Retrieve relevant constitutional sections →
Construct prompt →
LLM generates answer →
Stream response

System Prompt

The system prompt for the AI must be:

"You are a Nigerian constitutional legal assistant. Your role is to explain Nigerian laws and the Constitution clearly to citizens. You must only answer questions related to Nigerian law and constitutional rights. Every response must reference the relevant constitutional section when possible and explain it in simple language."

Additional Features

Add:

• Chat history
• Markdown rendering
• Copy response button
• Clear chat button
• Typing indicator

Safety

Add disclaimer:

"This AI provides informational guidance based on the Nigerian Constitution and should not be considered professional legal advice."

Tech Stack

Frontend

Next.js

TailwindCSS

React Markdown

Backend

Next.js API routes

AI

LLM (OpenAI / local model)

Retrieval

Embeddings

Vector database

Goal

The final product must allow a Nigerian citizen to ask questions like:

"What are my rights if I'm arrested?"

"Can police search my house without a warrant?"

"What does the constitution say about freedom of speech?"

And receive clear, structured, legally grounded answers referencing the Nigerian Constitution.

Design System

The UI should follow the dark modern SaaS aesthetic similar to Wetindeysup.

Color Palette

Background

#0B0B0F

Surface / cards

#12121A

Primary accent

#4F7CFF

Secondary accent

#7B5CFF

Primary text

#E6E6F0

Muted text

#9A9AAF

Usage:

Background → #0B0B0F
Cards / Chat bubbles → #12121A
Buttons → #4F7CFF
Hover accent → #7B5CFF

Typography

Use modern SaaS typography.

Primary UI font:
Inter

Heading font:
Sora

Legal citation / quote font:
JetBrains Mono

Usage:

Headings → Sora
Body text → Inter
Chat messages → Inter
Legal citations → JetBrains Mono
