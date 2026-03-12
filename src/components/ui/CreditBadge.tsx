"use client";

import React from "react";
import { Coins } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CreditBadgeProps {
  type: "paid" | "free" | "none";
  credits?: number;
  questionsRemaining?: number;
  onClick: () => void;
}

export const CreditBadge = ({
  type,
  credits,
  questionsRemaining,
  onClick,
}: CreditBadgeProps) => {
  if (type === "none") {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-all"
      >
        <Coins size={14} />
        Get Access
      </button>
    );
  }

  const count = type === "paid" ? credits ?? 0 : questionsRemaining ?? 0;
  const label = type === "paid" ? `${count} credit${count !== 1 ? "s" : ""}` : `${count} free`;
  const isLow = count <= 1;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-bold transition-all",
        isLow
          ? "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
          : "border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/10"
      )}
      title={type === "paid" ? "Click to buy more credits" : "Free questions remaining"}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isLow ? "bg-red-400" : "bg-green-400"
        )}
      />
      {label}
    </button>
  );
};
