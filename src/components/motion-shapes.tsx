"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

export function MotionShapes() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* 300 Floating Particles (Purple & Gray) */}
      {mounted &&
        Array.from({ length: 300 }).map((_, i) => {
          const isPurple = Math.random() > 0.5;
          return (
            <motion.div
              key={i}
              className={`absolute h-1.5 w-1.5 rounded-full ${
                isPurple ? "bg-purple-500/50" : "bg-gray-500/50"
              }`}
              initial={{
                x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
              }}
              animate={{
                y: [null, Math.random() * -300 - 100],
                x: [null, (Math.random() - 0.5) * 300],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 15 + 10,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 10,
              }}
            />
          );
        })}
    </div>
  );
}
