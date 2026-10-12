"use client";

import { motion, useReducedMotion } from "motion/react";
export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  // initial y whileInView son estáticos para que el HTML del servidor y del
  // cliente coincidan (si `reduce` cambiara el initial habría hydration mismatch).
  // Con movimiento reducido el reveal es instantáneo: conserva el fundido que
  // ayuda a comprender el cambio, sin desplazamiento.
  return (
    <motion.div
      className={`reveal ${className}`}
      initial={{ opacity: 0, transform: "translateY(18px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={reduce ? { duration: 0.01, delay: 0 } : { duration: 0.65, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
