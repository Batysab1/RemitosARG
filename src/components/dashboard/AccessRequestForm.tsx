"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react";
import { submitComprobante } from "@/actions/access";

type AccessRequest = {
  id: string;
  userId: string;
  status: "pendiente_pago" | "en_revision" | "aprobado" | "rechazado";
  comprobanteData: string | null;
  notaAdmin: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

const WHATSAPP_LINK = "https://wa.me/5491141613616?text=Hola%2C%20ya%20sub%C3%AD%20el%20comprobante%20de%20pago%20de%20RemitosARG.";

export function AccessRequestForm({ request }: { request: AccessRequest | null }) {
  const status = request?.status ?? "pendiente_pago";
  const [file, setFile] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function handleFile(selected: File) {
    setError("");
    if (!selected.type.startsWith("image/")) {
      setError("El comprobante debe ser una imagen (PNG, JPG o WEBP).");
      return;
    }
    if (selected.size > 2 * 1024 * 1024) {
      setError("El comprobante no puede pesar más de 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFile(reader.result as string);
    reader.readAsDataURL(selected);
  }

  async function send() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await submitComprobante(file);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el comprobante.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="access-panel">
      <div className="access-header">
        <h2>Activá tu cuenta</h2>
        <p>Para empezar a usar RemitosARG, realizá una transferencia de $20.000 y subí el comprobante.</p>
      </div>

      {status === "aprobado" && (
        <div className="access-status access-status--approved">
          <CheckCircle size={22} />
          <div>
            <strong>Cuenta aprobada</strong>
            <span>Ya podés usar clientes, productos, stock y documentos.</span>
          </div>
        </div>
      )}

      {status === "en_revision" && (
        <div className="access-status access-status--review">
          <CheckCircle size={22} />
          <div>
            <strong>Comprobante recibido</strong>
            <span>Está en revisión. Te avisamos por email cuando esté aprobado.</span>
          </div>
        </div>
      )}

      {status === "rechazado" && (
        <div className="access-status access-status--rejected">
          <XCircle size={22} />
          <div>
            <strong>Comprobante rechazado</strong>
            <span>{request?.notaAdmin || "No pudimos validar el comprobante. Volvé a subirlo o contactá soporte."}</span>
          </div>
        </div>
      )}

      {(status === "pendiente_pago" || status === "rechazado") && (
        <div className="access-card">
          <div className="access-instructions">
            <h3>Datos para la transferencia</h3>
            <div className="access-field"><span>Monto</span><strong>$20.000</strong></div>
            <div className="access-field"><span>Alias MP</span><strong>BautiiSab.mp</strong></div>
            <div className="access-field"><span>Titular</span><strong>Bautista Sabella</strong></div>
          </div>

          <label className="access-upload">
            <span>Subí el comprobante</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file && <img src={file} alt="Vista previa del comprobante" className="access-preview" />}
            {request?.comprobanteData && !file && (
              <img src={request.comprobanteData} alt="Comprobante anterior" className="access-preview" />
            )}
          </label>

          {error && <p className="form-error"><WarningCircle size={16} />{error}</p>}

          <button className="button button-primary" onClick={send} disabled={!file || busy}>
            {busy ? "Enviando…" : "Enviar comprobante"}
          </button>
        </div>
      )}

      {(status === "en_revision") && (
        <div className="support-box">
          <strong>Contactar con soporte</strong>
          <p>Si tenés dudas sobre el pago o querés agilizar la revisión, escribinos por WhatsApp.</p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="button button-primary">
            11 4161 3616
          </a>
        </div>
      )}
    </div>
  );
}
