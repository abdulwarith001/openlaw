"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, PlusCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  showExamples?: boolean;
}

const EXAMPLE_QUESTIONS = [
  "What are my fundamental rights?",
  "How can I challenge an illegal arrest?",
  "What does the constitution say about property rights?",
  "How are new states created in Nigeria?",
  "What are the qualifications for Presidency?",
  "How is the National Assembly structured?",
  "What is the role of the Judiciary?",
  "Tell me about freedom of speech",
];

export const ChatInput = ({
  onSendMessage,
  isLoading,
  showExamples = true,
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExampleClick = (question: string) => {
    setInput(question);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="w-full space-y-4">
      {/* Auto-scrolling Marquee */}
      <AnimatePresence>
        {showExamples && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="relative overflow-hidden w-full py-2 group/marquee"
          >
            <div className="absolute inset-y-0 left-0 w-24 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

            <motion.div
              className="flex gap-3 whitespace-nowrap"
              animate={{
                x: [0, -1000],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 30,
                  ease: "linear",
                },
              }}
              style={{ width: "fit-content" }}
            >
              {[...EXAMPLE_QUESTIONS, ...EXAMPLE_QUESTIONS].map(
                (question, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleExampleClick(question)}
                    className="px-4 py-2 rounded-full border border-white/5 bg-surface-raised/30 backdrop-blur-sm text-xs font-medium text-muted hover:text-primary hover:border-primary/30 transition-all hover:bg-primary/5 shadow-sm"
                  >
                    {question}
                  </button>
                ),
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleSubmit}
        className="relative group bg-surface-raised/50 backdrop-blur-md border border-white/5 rounded-full p-1 shadow-lg focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all duration-500"
      >
        <div className="flex items-end gap-2 px-3 py-0.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the Nigerian Constitution..."
            className="grow bg-transparent border-none outline-none text-foreground py-1.5 resize-none placeholder:text-muted/50 text-sm md:text-base leading-relaxed scrollbar-hide font-medium transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-full bg-primary text-black hover:bg-secondary disabled:bg-white/5 disabled:text-muted/30 transition-all duration-300 shadow-md hover:shadow-primary/20 hover:-translate-y-0.5 shrink-0 mb-0.5"
          >
            <Send size={16} className={cn(isLoading && "animate-pulse")} />
          </button>
        </div>
      </form>
    </div>
  );
};
