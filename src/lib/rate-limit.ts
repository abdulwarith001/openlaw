import { RateLimiterMemory } from "rate-limiter-flexible";

/**
 * Rate limiters for different endpoints.
 * In-memory for single-instance / local dev deployments.
 * For production on Vercel (serverless), swap to RateLimiterRedis with Upstash.
 * See Issue #12 in the security audit.
 */

// OTP sending: 3 attempts per IP per 15 minutes
export const otpSendLimiter = new RateLimiterMemory({
  points: 3,
  duration: 15 * 60,
  keyPrefix: "otp_send",
});

// OTP sending per email: 2 attempts per 10 minutes
export const otpEmailLimiter = new RateLimiterMemory({
  points: 2,
  duration: 10 * 60,
  keyPrefix: "otp_email",
});

// OTP verification: 5 attempts per email per 15 minutes (brute-force protection)
export const otpVerifyLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60,
  keyPrefix: "otp_verify",
});

// Access code validation: 5 attempts per IP per 10 minutes
export const codeValidateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 10 * 60,
  keyPrefix: "code_validate",
});

// Chat API: 20 requests per IP per minute
export const chatLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60,
  keyPrefix: "chat",
});

// Payment initialization: 5 per IP per 10 minutes
export const paymentInitLimiter = new RateLimiterMemory({
  points: 5,
  duration: 10 * 60,
  keyPrefix: "payment_init",
});

// Auth check: 10 per IP per minute (Issue #2)
export const authCheckLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
  keyPrefix: "auth_check",
});

// Payment verification: 3 per IP per 10 minutes (Issue #3)
export const paymentVerifyLimiter = new RateLimiterMemory({
  points: 3,
  duration: 10 * 60,
  keyPrefix: "payment_verify",
});

// TTS generation: 10 per IP per minute (Fix #1)
export const ttsLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
  keyPrefix: "tts",
});

/**
 * Extract client IP from request headers.
 * Prioritizes Vercel's trusted header to prevent spoofing (Issue #13).
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
