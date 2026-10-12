"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";

const INTRO_KEY = "remitosarg-intro-seen";
const EXIT_MS = 850;
const AUTOPLAY_MS = 3100;

function readSeen() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSeen() {
  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* sessionStorage no disponible */
  }
}

function CineIntro({ exiting }: { exiting: boolean }) {
  const title = "Bienvenido";
  return (
    <motion.div
      className="intro-cine"
      initial={{ opacity: 1, x: 0 }}
      animate={exiting ? { x: "75vw", opacity: 0 } : { x: 0, opacity: 1 }}
      transition={{ duration: 0.85, ease: [0.33, 0, 0.67, 1] }}
    >
      <h2 className="intro-cine-title" aria-label="Bienvenido a RemitosARG">
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
        a RemitosARG
      </motion.p>
    </motion.div>
  );
}

export function IntroGate({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  // El flag "ya vista" se lee fuera del render: en el servidor siempre es
  // false y en el cliente se suscribe al valor real, sin hydration mismatch.
  // El overlay solo existe post-hidratación (mounted), así que es seguro.
  const seen = useSyncExternalStore(() => () => {}, readSeen, () => false);
  const [dismissed, setDismissed] = useState(false);
  const [exiting, setExiting] = useState(false);

  const showIntro = mounted && !dismissed && !seen;

  useEffect(() => {
    if (!showIntro) return;
    if (exiting) {
      const timer = window.setTimeout(() => {
        setDismissed(true);
        writeSeen();
      }, EXIT_MS);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setExiting(true), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [showIntro, exiting]);

  function skip() {
    setExiting(true);
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="intro-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <button className="intro-skip" onClick={skip}>Saltar intro <ArrowUpRight size={14} /></button>
            <CineIntro exiting={exiting} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
