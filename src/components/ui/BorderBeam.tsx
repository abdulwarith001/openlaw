"use client";

import { motion } from "framer-motion";

interface BorderBeamProps {
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  delay?: number;
  className?: string;
}

export const BorderBeam = ({
  duration = 6,
  borderWidth = 2,
  colorFrom = "#FFD600",
  delay = 0,
  className = "",
}: BorderBeamProps) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        fill="transparent"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={`calc(100% - ${borderWidth}px)`}
          height={`calc(100% - ${borderWidth}px)`}
          rx="28" // Half of h-14 (px is implicit in SVG rect rx)
          stroke={colorFrom}
          strokeWidth={borderWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0.4, pathOffset: 0, opacity: 0 }}
          animate={{ pathOffset: 1, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay,
            repeatDelay: 1,
            times: [0, 0.1, 0.9, 1]
          }}
          style={{
            filter: `drop-shadow(0 0 6px ${colorFrom}) drop-shadow(0 0 2px ${colorFrom})`,
          }}
        />
      </svg>
    </div>
  );
};
