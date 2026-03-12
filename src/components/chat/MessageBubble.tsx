"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  User,
  ShieldAlert,
  Volume2,
  Square,
  Loader2,
  PlusCircle,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageBubbleProps {
  message: Message;
  onSuggestionClick?: (suggestion: string) => void;
  isLatestAssistant?: boolean;
}

export const MessageBubble = ({
  message,
  onSuggestionClick,
  isLatestAssistant,
}: MessageBubbleProps) => {
  const isAssistant = message.role === "assistant";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanTextForTTS = (text: string) => {
    return text
      .replace(/###/g, "")
      .replace(/\*\*/g, "")
      .replace(/>/g, "")
      .replace(/\[Chapter.*\]/g, "")
      .replace(/\n\n/g, ". ")
      .trim();
  };

  const handlePlayTTS = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoadingTTS(true);
    try {
      const cleanText = cleanTextForTTS(message.content);

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voice: "Idera" }),
      });

      if (!response.ok) throw new Error("TTS Failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;
      } else {
        audioRef.current = new Audio(url);
      }

      audioRef.current.onended = () => {
        setIsPlaying(false);
      };

      audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("TTS Error:", error);
    } finally {
      setIsLoadingTTS(false);
    }
  };

  // Suggestion Parsing
  const suggestionMatch = message.content.match(/\[\[SUGGESTIONS: (.*?)\]\]/);
  const suggestions = suggestionMatch
    ? suggestionMatch[1]
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  const displayContent = message.content
    .replace(/\[\[SUGGESTIONS: .*?\]\]/, "")
    .trim();

  return (
    <div
      className={cn(
        "flex w-full gap-4 mb-8 items-start",
        isAssistant ? "justify-start" : "justify-end",
      )}
    >
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 hidden md:flex items-center justify-center text-primary shrink-0 mt-1 shadow-sm">
          <ShieldAlert size={18} />
        </div>
      )}

      <div
        className={cn(
          "max-w-[97%] md:max-w-[80%] rounded-3xl p-5 md:p-6 text-sm md:text-base leading-relaxed tracking-tight transition-all duration-300 relative group",
          isAssistant
            ? "rounded-tl-lg bg-surface-raised/50 backdrop-blur-sm border border-white/5 text-foreground shadow-sm hover:border-white/10"
            : "rounded-tr-lg bg-primary text-black shadow-md font-medium selection:bg-black/10",
        )}
      >
        {isAssistant && (
          <button
            onClick={handlePlayTTS}
            disabled={isLoadingTTS}
            className={cn(
              "absolute top-4 right-4 w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-300 z-20",
              isPlaying
                ? "bg-red-500/10 border-red-500/20 text-red-500"
                : "bg-surface-raised/80 border-white/5 text-muted hover:text-primary hover:border-primary/20 backdrop-blur-md md:opacity-0 md:group-hover:opacity-100",
              isLoadingTTS && "animate-pulse opacity-100",
              isPlaying && "opacity-100",
            )}
            title={isPlaying ? "Stop listening" : "Listen (Nigerian Accent)"}
          >
            {isLoadingTTS ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isPlaying ? (
              <Square size={14} fill="currentColor" />
            ) : (
              <Volume2 size={14} />
            )}
          </button>
        )}
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="mb-4 last:mb-0 opacity-90">
                {children}
              </p>
            ),
            h1: ({ children }) => (
              <h1 className="text-xl md:text-2xl font-bold font-heading mb-6 tracking-tight">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg md:text-xl font-bold font-heading mb-4 tracking-tight">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base md:text-lg font-bold font-heading mb-3 tracking-tight">
                {children}
              </h3>
            ),
            ul: ({ children }) => (
              <ul className="list-disc ml-4 mb-5 space-y-2 opacity-90">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal ml-4 mb-5 space-y-2 opacity-90">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="pl-1">
                {children}
              </li>
            ),
            code: ({ children, className }) => (
              <code
                className={cn(
                  "font-mono px-1.5 py-0.5 rounded text-[0.9em]",
                  isAssistant
                    ? "bg-white/5 text-secondary"
                    : "bg-black/10 text-black/80",
                  className,
                )}
              >
                {children}
              </code>
            ),
            blockquote: ({ children }) => (
              <blockquote
                className={cn(
                  "border-l-3 pl-4 py-2 my-6 italic rounded-r-lg",
                  isAssistant
                    ? "border-primary/30 bg-primary/5 text-muted"
                    : "border-black/20 bg-black/5 text-black/70",
                )}
              >
                {children}
              </blockquote>
            ),
            strong: ({ children }) => (
              <strong
                className={cn(
                  "font-bold",
                  isAssistant ? "text-foreground" : "text-black",
                )}
              >
                {children}
              </strong>
            ),
          }}
        >
          {displayContent}
        </ReactMarkdown>

        {isAssistant && suggestions.length > 0 && isLatestAssistant && (
          <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
            <p className="w-full text-xs font-bold text-muted mb-1 flex items-center gap-2">
              <PlusCircle size={12} className="text-primary" />
              SUGGESTED NEXT STEPS
            </p>
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm font-medium text-muted hover:text-white hover:bg-white/10 hover:border-white/10 transition-all text-left max-w-full"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-surface-raised border border-white/5 hidden md:flex items-center justify-center text-muted shrink-0 mt-1 shadow-sm">
          <User size={18} />
        </div>
      )}
    </div>
  );
};
