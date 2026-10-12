"use client";

import { useState } from "react";
import { EditorDocumento } from "@/components/dashboard/DocumentEditor";
import type { DocumentType } from "@/actions/documents";

const TIPOS: { value: DocumentType; label: string }[] = [
  { value: "remito", label: "Remito" },
  { value: "presupuesto", label: "Presupuesto" },
  { value: "recibo", label: "Recibo" },
];

export function NewDocumentClient() {
  const [tipo, setTipo] = useState<DocumentType>("remito");
  return (
    <main className="dashboard-content">
      <div className="document-type-toggle" role="tablist" aria-label="Tipo de documento">
        {TIPOS.map(({ value, label }) => (
          <button key={value} role="tab" aria-selected={tipo === value} className={tipo === value ? "active" : ""} onClick={() => setTipo(value)}>{label}</button>
        ))}
      </div>
      <EditorDocumento tipo={tipo} />
    </main>
  );
}
