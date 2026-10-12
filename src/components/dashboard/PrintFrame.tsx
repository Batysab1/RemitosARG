"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function PrintFrame({ html, backHref }: { html: string; backHref: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const printed = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    const win = iframe.contentWindow;
    const doPrint = () => {
      // Imprimir una sola vez aunque el iframe recargue o React re-monte.
      if (printed.current) return;
      printed.current = true;
      try {
        win?.print();
      } catch {
        /* impresión no disponible */
      }
    };
    // Al cerrar el diálogo (imprima o cancele), volver al detalle.
    const goBack = () => router.push(backHref);
    iframe.addEventListener("load", doPrint);
    try {
      win?.addEventListener("afterprint", goBack);
    } catch {
      /* noop */
    }
    return () => {
      iframe.removeEventListener("load", doPrint);
      try {
        win?.removeEventListener("afterprint", goBack);
      } catch {
        /* noop */
      }
    };
  }, [router, backHref]);

  function printAgain() {
    printed.current = true;
    try {
      ref.current?.contentWindow?.print();
    } catch {
      /* noop */
    }
  }

  return (
    <main className="print-page">
      <div className="print-toolbar">
        <button type="button" className="button button-quiet" onClick={() => router.push(backHref)}>
          ← Volver al documento
        </button>
        <button type="button" className="button button-primary" onClick={printAgain}>
          Imprimir de nuevo
        </button>
      </div>
      <iframe ref={ref} srcDoc={html} title="Documento a imprimir" className="print-iframe" />
    </main>
  );
}
