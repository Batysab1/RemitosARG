"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";

export function FarewellOverlay({ onComplete }: { onComplete: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (exiting) {
      const timer = window.setTimeout(() => {
        setDismissed(true);
        onComplete();
      }, 850);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setExiting(true), 1800);
    return () => window.clearTimeout(timer);
  }, [exiting, onComplete]);

  function skip() {
    setExiting(true);
  }

  const title = "¡Nos vemos luego!";

  // Este overlay solo existe post-hidratación (tras el click en salir).
  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          className="intro-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <button className="intro-skip" onClick={skip}>
            Saltar <ArrowUpRight size={14} />
          </button>
          <motion.div
            className="intro-cine"
            initial={{ opacity: 1, x: 0 }}
            animate={exiting ? { x: "75vw", opacity: 0 } : { x: 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: [0.33, 0, 0.67, 1] }}
          >
            <h2 className="intro-cine-title" aria-label="Nos vemos luego">
              {title.split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 45 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: index * 0.045,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </h2>
            <motion.p
              className="intro-cine-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: [0.23, 1, 0.32, 1] }}
            >
              RemitosARG
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
