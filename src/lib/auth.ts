import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabase } from "./supabase";
import crypto from "crypto";

function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}

// --- Unique Access Code Generation ---
export function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I/O/0/1
  const bytes = crypto.randomBytes(8);
  const segments = [];
  for (let s = 0; s < 2; s++) {
    let segment = "";
    for (let i = 0; i < 4; i++) {
      segment += chars[bytes[s * 4 + i] % chars.length];
    }
    segments.push(segment);
  }
  return `KTL-${segments[0]}-${segments[1]}`;
}

// --- OTP Generation ---
export function generateOTP(): string {
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0) % 900000;
  return (100000 + num).toString();
}

// --- JWT Signing & Verification ---
export async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(getJWTSecret());
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret());
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

// --- Session Management ---
export async function setAccountCookie(accountId: string, sessionVersion: number = 1) {
  const token = await signToken({ accountId, sessionVersion });
  const cookieStore = await cookies();
  cookieStore.delete("openlaw_access"); // Clean up old cookie from previous system (Issue #17)
  cookieStore.set("openlaw_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export type AuthResult =
  | { status: "paid"; id: string; code: string; credits: number; email: string }
  | { status: "free"; id: string; questionsUsed: number; email: string }
  | { status: "none" };

export async function checkAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("openlaw_session")?.value;

  if (!token) return { status: "none" };

  const payload = await verifyToken(token);
  if (!payload || !payload.accountId) return { status: "none" };

  const { data } = await supabase
    .from("accounts")
    .select("id, email, code, credits_remaining, free_questions_used, is_active, session_version")
    .eq("id", payload.accountId)
    .eq("is_active", true)
    .single();

  if (!data) return { status: "none" };
  
  // Enforce session version (Fix #2 Session Fixation)
  if (data.session_version !== payload.sessionVersion) {
    return { status: "none" };
  }

  if (data.code) {
    return {
      status: "paid",
      id: data.id,
      code: data.code,
      credits: data.credits_remaining,
      email: data.email,
    };
  }

  return {
    status: "free",
    id: data.id,
    questionsUsed: data.free_questions_used,
    email: data.email,
  };
}
