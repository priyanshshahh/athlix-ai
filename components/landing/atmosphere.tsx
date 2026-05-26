"use client";

import { motion } from "framer-motion";

/**
 * Cinematic background: grid + animated gradient blobs + floating particles.
 * Sits at z-0 behind all content.
 */
export function Atmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Animated grid */}
      <div className="absolute inset-0 grid-overlay opacity-70" />
      <div
        className="absolute inset-0"
        style={{
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)",
        }}
      >
        <div className="absolute inset-0 grid-overlay-fine opacity-40" />
      </div>

      {/* Holographic blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-32 -left-24 h-[60vh] w-[60vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0,229,255,0.18) 0%, rgba(0,229,255,0) 70%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/3 -right-24 h-[60vh] w-[60vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.20) 0%, rgba(168,85,247,0) 70%)",
          filter: "blur(70px)",
        }}
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-0 left-1/3 h-[40vh] w-[60vh] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(56,189,248,0.16) 0%, rgba(56,189,248,0) 70%)",
          filter: "blur(80px)",
        }}
        animate={{ x: [0, 25, 0], y: [0, 15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      {Array.from({ length: 22 }).map((_, i) => {
        const left = (i * 47.3) % 100;
        const top = (i * 37.7) % 100;
        const delay = (i * 0.7) % 6;
        const dur = 6 + ((i * 1.3) % 6);
        return (
          <motion.div
            key={i}
            aria-hidden
            className="absolute h-1 w-1 rounded-full bg-cyan-300/60"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              boxShadow: "0 0 8px rgba(0,229,255,0.8)",
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.9, 0.2],
            }}
            transition={{
              duration: dur,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Top vignette */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
