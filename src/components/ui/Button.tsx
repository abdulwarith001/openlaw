import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-black hover:bg-accent/90 shadow-sm hover:shadow-md",
      secondary: "bg-surface-raised text-foreground border border-white/5 hover:bg-white/5",
      outline: "bg-transparent border border-primary text-foreground hover:bg-primary/5",
      ghost: "bg-transparent hover:bg-white/5 text-muted hover:text-foreground",
    };

    const sizes = {
      sm: "h-9 px-4 text-xs",
      md: "h-11 px-6 text-sm",
      lg: "h-13 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] font-heading font-bold uppercase tracking-widest",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
