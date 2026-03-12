import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = ({ className, hover = true, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "bg-surface border border-muted/5 rounded-xl p-6 transition-all duration-300",
        hover && "hover:border-muted/20 hover:bg-surface/80 hover:shadow-xl hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  );
};
