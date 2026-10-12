"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { upsertIssuer } from "@/actions/issuer";
import { FarewellOverlay } from "./FarewellOverlay";

const IVA_OPTIONS = [
  "Responsable Inscripto",
  "Responsable Monotributo",
  "Exento",
  "Consumidor Final",
  "No responsable",
];

export function IssuerSettingsForm({ issuer }: { issuer: { razonSocial: string; nombreComercial: string; cuit: string; condicionIva: string; domicilio: string; localidad: string; telefono: string; logoData: string | null } | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    razonSocial: issuer?.razonSocial ?? "",
    nombreComercial: issuer?.nombreComercial ?? "",
    cuit: issuer?.cuit ?? "",
    condicionIva: issuer?.condicionIva ?? "Responsable Inscripto",
    domicilio: issuer?.domicilio ?? "",
    localidad: issuer?.localidad ?? "",
    telefono: issuer?.telefono ?? "",
  });
  const [logoData, setLogoData] = useState<string | null>(issuer?.logoData ?? null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFarewell, setShowFarewell] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      window.alert("El logo debe ser una imagen (PNG, JPG o WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      window.alert("El logo no puede pesar más de 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoData(reader.result as string);
    reader.readAsDataURL(file);
    setSaved(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    await upsertIssuer({ ...form, logoData });
    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  async function handleFarewellComplete() {
    await authClient.signOut();
    router.push("/");
  }

  function logout() {
    setShowFarewell(true);
  }

  return (
    <form onSubmit={submit} className="issuer-form">
      <div className="issuer-section">
        <h2>Datos de tu empresa</h2>
        <p>Esta información aparece en los remitos y presupuestos que generés.</p>
      </div>
      <div className="issuer-grid">
        <label>
          <span>Nombre comercial</span>
          <input value={form.nombreComercial} onChange={(e) => update("nombreComercial", e.target.value)} placeholder="Ej: RemitosARG" />
        </label>
        <label>
          <span>Razón social</span>
          <input value={form.razonSocial} onChange={(e) => update("razonSocial", e.target.value)} placeholder="Ej: RemitosARG S.A.S." />
        </label>
        <label>
          <span>CUIT / CUIL</span>
          <input value={form.cuit} onChange={(e) => update("cuit", e.target.value)} placeholder="30-12345678-1" />
        </label>
        <label>
          <span>Condición frente al IVA</span>
          <select value={form.condicionIva} onChange={(e) => update("condicionIva", e.target.value)}>
            {IVA_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span>Domicilio</span>
          <input value={form.domicilio} onChange={(e) => update("domicilio", e.target.value)} placeholder="Av. Corrientes 1234" />
        </label>
        <label>
          <span>Localidad</span>
          <input value={form.localidad} onChange={(e) => update("localidad", e.target.value)} placeholder="CABA" />
        </label>
        <label>
          <span>Teléfono</span>
          <input value={form.telefono} onChange={(e) => update("telefono", e.target.value)} placeholder="011 1234-5678" />
        </label>
        <label>
          <span>Logo</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {logoData && <img src={logoData} alt="Vista previa del logo" className="logo-preview" />}
        </label>
      </div>
      <div className="issuer-actions">
        <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</Button>
        {saved && <span className="form-success-inline">Cambios guardados.</span>}
      </div>
      <div className="issuer-divider" />
      <button type="button" className="logout-button" onClick={logout}>
        <SignOut size={18} /> Cerrar sesión
      </button>
      {showFarewell && <FarewellOverlay onComplete={handleFarewellComplete} />}
    </form>
  );
}
