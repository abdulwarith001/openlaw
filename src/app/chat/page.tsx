"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Trash2,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { MessageBubble, type Message } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Dialog } from "@/components/ui/Dialog";
import { PaywallModal } from "@/components/ui/PaywallModal";
import { CreditBadge } from "@/components/ui/CreditBadge";

interface CreditInfo {
  type: "paid" | "free" | "none";
  credits_remaining?: number;
  questions_remaining?: number;
  email?: string;
  code?: string;
};

export default function ChatPage() {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallStep, setPaywallStep] = useState<"email" | "buy" | "code">("email");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your Nigerian Constitutional Legal Assistant. How can I help you understand your rights or the laws of the Federation today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [fingerprint, setFingerprint] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestResponseRef = useRef<HTMLDivElement>(null);

  // Initialize fingerprint
  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (error) {
        console.error("Fingerprint error:", error);
        // Fallback: use a random ID stored in sessionStorage
        let fallback = sessionStorage.getItem("ol_fp");
        if (!fallback) {
          fallback = crypto.randomUUID();
          sessionStorage.setItem("ol_fp", fallback);
        }
        setFingerprint(fallback);
      }
    };
    initFingerprint();
  }, []);

  // Fetch credit info
  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/payment/credits");
      const data = await res.json();
      setCreditInfo(data);
    } catch {
      setCreditInfo({ type: "none" });
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      latestResponseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Show paywall on first load if no auth
  useEffect(() => {
    if (!isInitialLoading && creditInfo?.type === "none") {
      setIsPaywallOpen(true);
    }
  }, [isInitialLoading, creditInfo?.type]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const allMessages = [...messages, userMessage];
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      });

      const data = await response.json();

      // Handle payment required
      if (response.status === 402 || response.status === 401) {
        setIsPaywallOpen(true);
        // Remove the user message since it wasn't processed
        setMessages((prev) => prev.slice(0, -1));
        setIsLoading(false);
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch response");

      const assistantMessage: Message = {
        role: "assistant",
        content: data.content,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh credits after successful message
      fetchCredits();
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaywallUnlocked = () => {
    setIsPaywallOpen(false);
    setPaywallStep("email");
    fetchCredits();
  };

  const handleOpenPaywall = (step: "email" | "buy" | "code" = "email") => {
    setPaywallStep(step);
    setIsPaywallOpen(true);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat cleared. I am ready to help you with any constitutional questions.",
      },
    ]);
  };

  return (
    <div className="flex h-screen bg-background selection:bg-primary/30 selection:text-primary">
      <main className="grow flex flex-col relative h-screen overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full" />
        </div>

        {/* Header */}
        <header className="h-16 shrink-0 bg-transparent px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-80 transition-opacity flex items-center gap-2 group">
              <Logo size={28} />
              <span className="text-lg font-black font-heading tracking-tighter text-foreground">
                OpenLaw
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {creditInfo && creditInfo.type !== "none" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenPaywall("buy")}
                className="hidden md:flex h-9 px-4 rounded-xl text-black font-bold text-xs gap-2"
              >
                Buy Credits
              </Button>
            )}
            {creditInfo && (
              <CreditBadge
                type={creditInfo.type}
                credits={creditInfo.credits_remaining}
                questionsRemaining={creditInfo.questions_remaining}
                onClick={() => handleOpenPaywall(creditInfo.type === "paid" ? "buy" : "email")}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="px-3 h-9 text-muted hover:text-red-500 hover:bg-red-500/5 transition-colors gap-2 rounded-xl"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Clear</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDisclaimerOpen(true)}
              className="flex gap-2 h-9 px-4 border-white/5 bg-surface-raised shadow-sm rounded-xl"
            >
              <ShieldAlert size={14} className="text-primary" />
              <span className="hidden sm:inline">Disclaimer</span>
            </Button>
          </div>
        </header>

        {/* Chat Content */}
        <div className="grow overflow-y-auto z-10 scrollbar-hide pt-12 pb-10">
          <div className="max-w-7xl mx-auto px-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message, idx) => (
                <motion.div
                  key={idx}
                  ref={
                    idx === messages.length - 1 && message.role === "assistant"
                      ? latestResponseRef
                      : null
                  }
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="scroll-mt-32"
                >
                  <MessageBubble 
                    message={message} 
                    isLatestAssistant={idx === messages.length - 1 && message.role === "assistant"}
                    onSuggestionClick={handleSendMessage}
                  />
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex w-full gap-4 mb-6 justify-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
                    <ShieldAlert size={18} />
                  </div>
                  <div className="bg-surface-raised border border-white/5 rounded-2xl p-5 shadow-sm">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-80" />
          </div>
        </div>

        {/* Input Area */}
        <div className="z-20 px-4 md:px-8 pb-8 bg-transparent pt-0 -mt-16">
          <div className="max-w-5xl mx-auto relative">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              showExamples={!messages.some((m) => m.role === "user")}
            />
          </div>
        </div>
      </main>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onUnlocked={handlePaywallUnlocked}
        fingerprint={fingerprint}
        initialStep={paywallStep}
        initialEmail={creditInfo?.email}
      />

      <Dialog
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        title="Disclaimer & AI Guidance"
      >
        <div className="space-y-4 text-muted leading-relaxed">
          <p>
            OpenLaw is an <span className="font-bold text-white">AI-powered legal assistant</span> designed to
            help explain the provisions of the 1999 Constitution of the Federal
            Republic of Nigeria.
          </p>
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-3">
            <h3 className="text-foreground font-bold flex items-center gap-2">
              <ShieldAlert size={16} className="text-primary" />
              Important Notice
            </h3>
            <p className="text-sm">
              While we strive for accuracy, the information provided here is for
              **informational purposes only** and does **not** constitute formal
              legal advice.
            </p>
          </div>
          <ul className="space-y-2 text-sm list-disc pl-4">
            <li>
              Laws are subject to judicial interpretation and legislative
              amendments.
            </li>
            <li>
              This assistant should not replace a qualified Legal Practitioner.
            </li>
            <li>
              Always verify critical legal information with official government
              gazettes.
            </li>
          </ul>
        </div>
      </Dialog>
    </div>
  );
}
