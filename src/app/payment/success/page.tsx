"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Copy, Loader2, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function PaymentSuccessPage() {
  const [accessCode, setAccessCode] = useState("");
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const reference = params.get("reference");

      if (!reference) {
        setError("No payment reference found.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Payment verification failed.");
          return;
        }

        setAccessCode(data.access_code);
        setCredits(data.credits_remaining);
      } catch {
        setError("Failed to verify payment. Please contact support.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-primary/30 selection:text-primary">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Logo size={28} />
          <span className="text-lg font-black font-heading tracking-tighter text-foreground">
            OpenLaw
          </span>
        </div>

        <div className="bg-surface-raised/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 shadow-2xl">
          {isLoading ? (
            <div className="text-center space-y-4">
              <Loader2 size={40} className="animate-spin text-primary mx-auto" />
              <p className="text-muted">Verifying your payment...</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <ShieldAlert size={40} className="text-red-400 mx-auto" />
              <h2 className="text-lg font-bold text-foreground">Verification Failed</h2>
              <p className="text-sm text-muted">{error}</p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-raised border border-white/5 text-sm font-bold text-foreground hover:border-white/10 transition-all"
              >
                Go to Chat
              </Link>
            </div>
          ) : (
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>

              <div>
                <h2 className="text-xl font-bold font-heading text-foreground mb-1">
                  Payment Successful! 🎉
                </h2>
                <p className="text-sm text-muted">
                  You now have <span className="text-green-400 font-bold">{credits} credits</span> available.
                </p>
              </div>

              {/* Access Code Display */}
              <div className="bg-background border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-muted mb-2 font-bold uppercase tracking-wider">
                  Your Access Code
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold text-primary tracking-wider">
                    {accessCode}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-muted hover:text-foreground hover:border-white/20 transition-all"
                    title="Copy code"
                  >
                    {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
                <p className="text-xs text-muted">
                  💾 <span className="text-foreground font-bold">Save this code!</span> Use it on any device to access your credits.
                </p>
              </div>

              {/* CTA */}
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary/90 transition-all shadow-md"
              >
                Start Chatting
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
