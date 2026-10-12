"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

const LEAVE_MS = 200;
const REVEAL_DELAY_MS = 120;
const SAFETY_MS = 3000;

type Phase = "idle" | "leaving" | "entering";

export function RouteVeil() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const pending = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function clearTimers() {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
  }

  // La ruta cambió: revelar la página nueva y volver a idle.
  useEffect(() => {
    if (phase === "idle") return;
    pending.current = null;
    later(() => setPhase("idle"), REVEAL_DELAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      // Rutas de API (ej. Descargar PDF): descarga nativa del browser, sin velo.
      if (url.pathname.startsWith("/api/")) return;
      // Misma página (anchors #sección): scroll suave nativo, sin velo.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      const destination = url.pathname + url.search + url.hash;
      // Re-clic en plena transición: retarget desde el estado actual.
      clearTimers();
      pending.current = destination;
      setPhase("leaving");
      later(() => {
        if (pending.current) {
          router.push(pending.current);
          setPhase("entering");
        }
      }, LEAVE_MS);
      // Seguridad: si la navegación no completa, nunca atrapar al usuario.
      later(() => {
        pending.current = null;
        setPhase("idle");
      }, SAFETY_MS);
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, [router]);

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          className="route-veil"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === "leaving" ? 0.2 : 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="route-veil-inner">
            <motion.span
              className="route-veil-mark"
              initial={{ opacity: 0, transform: "scale(0.94)" }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              R
            </motion.span>
            <motion.span
              className="route-veil-line"
              initial={{ transform: "scaleX(0)" }}
              animate={{ transform: "scaleX(1)" }}
              transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1], repeat: Infinity, repeatType: "loop", repeatDelay: 0.15 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
