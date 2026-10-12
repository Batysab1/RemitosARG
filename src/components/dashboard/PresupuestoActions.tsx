"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, XCircle } from "@phosphor-icons/react";
import { approvePresupuesto, convertPresupuestoToRecibo, convertPresupuestoToRemito, rejectPresupuesto } from "@/actions/documents";

export function PresupuestoActions({ docId, tipo, estado }: { docId: string; tipo: string; estado: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | "convert" | "convertRecibo" | null>(null);
  const [error, setError] = useState("");

  if (tipo !== "presupuesto") return null;

  async function run(kind: "approve" | "reject" | "convert" | "convertRecibo") {
    setBusy(kind);
    setError("");
    try {
      if (kind === "approve") {
        await approvePresupuesto(docId);
        router.refresh();
      } else if (kind === "reject") {
        await rejectPresupuesto(docId);
        router.refresh();
      } else if (kind === "convertRecibo") {
        const result = await convertPresupuestoToRecibo(docId);
        router.push(`/dashboard/documentos/${result.id}`);
      } else {
        const result = await convertPresupuestoToRemito(docId);
        router.push(`/dashboard/documentos/${result.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setBusy(null);
    }
  }

  if (estado === "convertido" || estado === "rechazado" || estado === "anulado") {
    return (
      <p className="presupuesto-note">
        {estado === "convertido" ? "Este presupuesto ya fue convertido." : "Este presupuesto fue rechazado."}
      </p>
    );
  }

  return (
    <div className="presupuesto-actions">
      {estado === "borrador" && (
        <>
          <button type="button" className="button button-primary" onClick={() => run("approve")} disabled={busy !== null}>
            <CheckCircle size={16} /> {busy === "approve" ? "Aprobando…" : "Aprobar"}
          </button>
          <button type="button" className="button button-quiet" onClick={() => run("reject")} disabled={busy !== null}>
            <XCircle size={16} /> {busy === "reject" ? "Rechazando…" : "Rechazar"}
          </button>
        </>
      )}
      {estado === "aprobado" && (
        <>
          <button type="button" className="button button-primary" onClick={() => run("convert")} disabled={busy !== null}>
            <ArrowRight size={16} /> {busy === "convert" ? "Convirtiendo…" : "Convertir a remito"}
          </button>
          <button type="button" className="button button-quiet" onClick={() => run("convertRecibo")} disabled={busy !== null}>
            <ArrowRight size={16} /> {busy === "convertRecibo" ? "Convirtiendo…" : "Convertir a recibo"}
          </button>
          <button type="button" className="button button-quiet" onClick={() => run("reject")} disabled={busy !== null}>
            <XCircle size={16} /> {busy === "reject" ? "Rechazando…" : "Rechazar"}
          </button>
        </>
      )}
      {error && <p className="presupuesto-error">{error}</p>}
    </div>
  );
}
