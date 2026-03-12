"use client";

import React from "react";
import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 40 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial="rest"
        whileHover="hover"
      >
        {/* Outer Geometric "O" with a technical break */}
        <motion.path
          d="M20 4C11.1634 4 4 11.1634 4 20C4 28.8366 11.1634 36 20 36C28.8366 36 36 28.8366 36 20C36 18.5 35.8 17.1 35.4 15.8"
          stroke="var(--primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          variants={{
            rest: { pathLength: 1, opacity: 1 },
            hover: { pathLength: 0.9, rotate: 10 }
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {/* Minimalist Scales - Vertical Beam */}
        <motion.path
          d="M20 12V28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          variants={{
            rest: { scaleY: 1 },
            hover: { scaleY: 1.1 }
          }}
        />

        {/* Minimalist Scales - Horizontal Beam */}
        <motion.path
          d="M12 16H28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          variants={{
            rest: { rotate: 0 },
            hover: { rotate: [0, -10, 10, 0] }
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* Left Scale */}
        <motion.path
          d="M10 24L12 18L14 24H10Z"
          fill="var(--primary)"
          opacity="0.8"
          variants={{
            rest: { y: 0 },
            hover: { y: 2 }
          }}
        />

        {/* Right Scale */}
        <motion.path
          d="M26 24L28 18L30 24H26Z"
          fill="var(--primary)"
          opacity="0.8"
          variants={{
            rest: { y: 0 },
            hover: { y: -2 }
          }}
        />

        {/* Central Pivot Point */}
        <circle cx="20" cy="16" r="2" fill="var(--primary)" />
      </motion.svg>
    </div>
  );
};
