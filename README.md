# 🇳🇬 OpenLaw

**OpenLaw** is a premium, AI-powered legal assistant dedicated to making the **Constitution of the Federal Republic of Nigeria (1999, as amended)** accessible, understandable, and interactive for every citizen.

Built with a focus on **strict legal grounding** and **visual excellence**, OpenLaw ensures that every answer is backed by verifiable constitutional authority.

![OpenLaw Preview](https://github.com/user-attachments/assets/placeholder-preview)

## 🚀 Key Features

- **⚖️ 100% Constitutional Coverage**: Complete indexing of all **320 sections** and Schedules I-VII. Our custom gap-filling parser ensures no right or provision is left behind.
- **🔍 Verified Knowledge (RAG)**: Powered by Retrieval Augmented Generation. The AI doesn't just "chat"—it searches a high-fidelity vector database of the Constitution before answering.
- **🎙️ Premium Nigerian TTS**: Integrated with **YarnGPT** to provide a high-quality, local Nigerian accent ("Idera") with word-level text highlighting.
- **💬 Guided Exploration**: Automatically generates 3 context-aware suggested follow-up questions after every response to help you navigate complex legal topics.
- **🛡️ Strict Grounding**: Built-in enforcement rules prevent hallucinations and ensure responses stay strictly within the scope of Nigerian Constitutional Law.
- **✨ Premium UI/UX**: A state-of-the-art interface featuring glassmorphic design, fluid animations, and a focus on readability.

## 🛠️ Technical Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI/LLM**: [OpenAI GPT-4o](https://openai.com/)
- **Embeddings**: `text-embedding-3-small`
- **Vector Search**: Local JSON-based vector storage with Cosine Similarity
- **Voice**: [YarnGPT](https://github.com/lucidrains/yarngpt) (Nigerian Accent Synthesis)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🏗️ Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API Key
- YarnGPT API Access (for TTS features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/openlaw.git
   cd openlaw
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (`.env.local`):
   ```env
   OPENAI_API_KEY=your_openai_key
   YARNGPT_API_URL=your_yarngpt_url
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📖 Project Structure

- `src/app/api/chat`: The core RAG engine and LLM integration.
- `src/app/api/tts`: Proxy for Nigerian accent synthesis.
- `src/data/vector_constitution.json`: The fully parsed and indexed Constitution.
- `src/data/embeddings.json`: Vector embeddings for semantic search.
- `scripts/`: Data ingestion, parser logic (320/320 coverage), and embedding generation tools.
- `src/components/chat`: Premium UI components including `MessageBubble` and `ChatInput`.

## 📜 Disclaimer

OpenLaw is an AI-powered informational tool and does **not** constitute formal legal advice. Users are encouraged to consult with qualified Legal Practitioners for specific legal matters.

---
*Empowering Nigerians through legal transparency.*
