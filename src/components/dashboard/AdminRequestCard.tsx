"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, X, XCircle } from "@phosphor-icons/react";
import { approveAccessRequest, rejectAccessRequest } from "@/actions/admin";

type AdminRequest = {
  id: string;
  userId: string;
  status: "pendiente_pago" | "en_revision" | "aprobado" | "rechazado";
  comprobanteData: string | null;
  notaAdmin: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
};

const STATUS_LABELS: Record<AdminRequest["status"], string> = {
  pendiente_pago: "Pendiente de pago",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export function AdminRequestCard({ request }: { request: AdminRequest }) {
  const [note, setNote] = useState(request.notaAdmin ?? "");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function approve() {
    setBusy(true);
    await approveAccessRequest(request.id);
    setBusy(false);
    router.refresh();
  }

  async function reject() {
    setBusy(true);
    await rejectAccessRequest(request.id, note);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="admin-request-card">
      <div className="admin-request-header">
        <div>
          <strong>{request.userName || "Sin nombre"}</strong>
          <span>{request.userEmail}</span>
        </div>
        <span className={`admin-request-badge admin-request-badge--${request.status}`}>{STATUS_LABELS[request.status]}</span>
      </div>

      {request.comprobanteData && (
        <>
          <button type="button" className="admin-request-receipt" onClick={() => setOpen(true)}>
            <img src={request.comprobanteData} alt="Comprobante" />
            <span>Ver comprobante</span>
          </button>
          {open && (
            <div className="receipt-lightbox" onClick={() => setOpen(false)}>
              <button type="button" className="receipt-lightbox-close" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
                <X size={24} />
              </button>
              <img src={request.comprobanteData} alt="Comprobante ampliado" onClick={(e) => e.stopPropagation()} />
            </div>
          )}
        </>
      )}

      {request.submittedAt && (
        <p className="admin-request-meta">Comprobante enviado el {new Date(request.submittedAt).toLocaleString("es-AR")}</p>
      )}

      {request.status !== "aprobado" && (
        <div className="admin-request-actions">
          <label>
            <span>Nota (solo para rechazo)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: el comprobante no se lee, subí uno nuevo" rows={2} />
          </label>
          <div className="admin-request-buttons">
            <button className="button button-primary" onClick={approve} disabled={busy}>
              <CheckCircle size={16} /> Aprobar
            </button>
            <button className="button button-quiet" onClick={reject} disabled={busy}>
              <XCircle size={16} /> Rechazar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
