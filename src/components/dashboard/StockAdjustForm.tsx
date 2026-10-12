"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "@phosphor-icons/react";
import { toast } from "sonner";
import { adjustStock } from "@/actions/stock";
import { Button } from "@/components/ui/Button";

export function StockAdjustForm({ productId }: { productId: string }) {
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState<"ingreso" | "egreso" | null>(null);

  async function send(tipo: "ingreso" | "egreso") {
    const amount = Number(cantidad);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Escribí una cantidad mayor a cero.");
      return;
    }
    setBusy(tipo);
    try {
      const form = new FormData();
      form.set("productId", productId);
      form.set("tipo", tipo);
      form.set("cantidad", String(amount));
      form.set("motivo", motivo.trim() || (tipo === "ingreso" ? "Ingreso manual" : "Egreso manual"));
      await adjustStock(form);
      toast.success(tipo === "ingreso" ? "Stock ingresado." : "Stock egresado.");
      setCantidad("");
      setMotivo("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo mover stock.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stock-adjust">
      <input
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        type="number"
        min="0.01"
        step="any"
        inputMode="decimal"
        placeholder="Cantidad"
        aria-label="Cantidad"
      />
      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo (opcional)"
        aria-label="Motivo"
        className="stock-adjust-motivo"
      />
      <Button size="sm" disabled={busy !== null} onClick={() => send("ingreso")}>
        <ArrowUp size={14} /> {busy === "ingreso" ? "Sumando…" : "Ingresar"}
      </Button>
      <button type="button" className="button button-quiet min-h-8 px-3 text-xs" disabled={busy !== null} onClick={() => send("egreso")}>
        <ArrowDown size={14} /> {busy === "egreso" ? "Quitando…" : "Egresar"}
      </button>
    </div>
  );
}
