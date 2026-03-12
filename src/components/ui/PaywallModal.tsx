"use client";

import React, { useState } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  KeyRound,
} from "lucide-react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  fingerprint: string;
  initialStep?: "email" | "otp" | "buy" | "code";
  initialEmail?: string;
}

const CREDIT_PACKS = [
  { credits: 5, price: 500, label: "5" },
  { credits: 10, price: 1000, label: "10" },
  { credits: 25, price: 2500, label: "25" },
];

const FREE_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_CREDITS || 0);

export const PaywallModal = ({
  isOpen,
  onClose,
  onUnlocked,
  fingerprint,
  initialStep = "email",
  initialEmail = "",
}: PaywallModalProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [selectedPack, setSelectedPack] = useState(1);
  const [step, setStep] = useState<"email" | "otp" | "buy" | "code">(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sync initial state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      if (initialEmail) setEmail(initialEmail);
      setError("");
      setSuccess("");
    }
  }, [isOpen, initialStep, initialEmail]);

  if (!isOpen) return null;

  const handleInitialEmailCheck = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to check email status");
        return;
      }

      if (data.status === "EXISTING_PAID") {
        setStep("code");
      } else if (data.status === "EXISTING_FREE") {
        // Re-verify via OTP to re-establish session (Issue #6 + #9)
        await handleSendOTP();
      } else {
        // NEW user -> Need to send OTP to verify and create account
        await handleSendOTP();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), fingerprint }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setStep("otp");
      setSuccess("Verification code sent to your email!");
    } catch {
      setError("Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError("Please enter the verification code");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), fingerprint }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      if (FREE_LIMIT > 0) {
        setSuccess(`Verified! You have ${FREE_LIMIT} free questions.`);
        setTimeout(() => onUnlocked(), 1000);
      } else {
        setSuccess("Account verified! Choose a credit pack to continue.");
        setTimeout(() => setStep("buy"), 1000);
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCode = async () => {
    if (!accessCode.trim()) {
      setError("Please enter your access code");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess(`Access granted! ${data.credits_remaining} credits remaining.`);
      setTimeout(() => onUnlocked(), 1000);
    } catch {
      setError("Validation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyCredits = async () => {
    setIsLoading(true);
    setError("");
    try {
      const pack = CREDIT_PACKS[selectedPack];
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), credits: pack.credits }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      window.location.href = data.authorization_url;
    } catch {
      setError("Failed to initialize payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[#0B0B0F] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={20} className="text-primary" />
              <h2 className="text-lg font-bold font-heading text-foreground tracking-tight">
                {step === "buy" ? "Get Credits" : step === "code" ? "Access Code" : "OpenLaw Access"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-white/5 flex items-center justify-center text-muted hover:text-foreground hover:border-white/10 transition-all"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-muted">
            {step === "email" && (FREE_LIMIT > 0 ? `Enter your email to get ${FREE_LIMIT} free questions.` : "Enter your email to get started.")}
            {step === "otp" && `We sent a code to ${email}`}
            {step === "buy" && "Choose a credit pack to continue chatting."}
            {step === "code" && "This email is associated with a paid account. Enter your code to unlock."}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-3">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          {/* Step: Email */}
          {step === "email" && (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                onKeyDown={(e) => e.key === "Enter" && handleInitialEmailCheck()}
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-white/5 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                autoFocus
              />
              <button
                onClick={handleInitialEmailCheck}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Continue"}
              </button>
              <button
                onClick={() => { setStep("code"); setError(""); setSuccess(""); }}
                className="w-full text-xs text-muted hover:text-foreground transition-colors flex items-center justify-center gap-1 py-1"
              >
                <KeyRound size={12} />
                Already have a code?
              </button>
            </>
          )}

          {/* Step: OTP */}
          {step === "otp" && (
            <>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-white/5 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all text-center text-lg tracking-[0.3em] font-mono"
                autoFocus
              />
              <button
                onClick={handleVerifyOTP}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Verify"}
              </button>
              <button
                onClick={() => { setStep("email"); setOtp(""); setError(""); setSuccess(""); }}
                className="w-full text-xs text-muted hover:text-foreground transition-colors py-1 text-center"
              >
                ← Back
              </button>
            </>
          )}

          {/* Step: Access Code */}
          {step === "code" && (
            <>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="KTL-XXXX-XXXX"
                onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-white/5 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all text-center text-lg tracking-widest font-mono"
                autoFocus
              />
              <button
                onClick={handleValidateCode}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Unlock Access"}
              </button>
              <button
                onClick={() => { setStep("email"); setAccessCode(""); setError(""); setSuccess(""); }}
                className="w-full text-xs text-muted hover:text-foreground transition-colors py-1 text-center"
              >
                ← Use a different email
              </button>
            </>
          )}

          {/* Step: Buy Credits */}
          {step === "buy" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {CREDIT_PACKS.map((pack, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPack(i)}
                    className={`relative p-3 rounded-xl border text-center transition-all ${
                      selectedPack === i
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-white/5 bg-surface-raised text-muted hover:border-white/10"
                    }`}
                  >
                    {i === 1 && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-primary text-black px-2 py-0.5 rounded-full">
                        BEST
                      </span>
                    )}
                    <div className="text-lg font-bold">{pack.credits}</div>
                    <div className="text-xs text-muted">₦{pack.price.toLocaleString()}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleBuyCredits}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : `Pay ₦${CREDIT_PACKS[selectedPack].price.toLocaleString()}`}
              </button>
              <button
                onClick={() => { setStep("email"); setError(""); setSuccess(""); }}
                className="w-full text-xs text-muted hover:text-foreground transition-colors py-1 text-center"
              >
                ← Back
              </button>
              <p className="text-[11px] text-muted/50 text-center">Secured by Paystack</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
