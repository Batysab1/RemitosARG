"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient, createProduct } from "@/actions/catalog";
import { Button } from "@/components/ui/Button";

export function CatalogForm({ type }: { type: "cliente" | "producto" }) {
  const [busy, setBusy] = useState(false);
  async function submit(form: FormData) {
    setBusy(true);
    try { await (type === "cliente" ? createClient(form) : createProduct(form)); toast.success(type === "cliente" ? "Cliente guardado." : "Producto guardado."); (document.getElementById(`${type}-form`) as HTMLFormElement)?.reset(); } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar."); } finally { setBusy(false); }
  }
  return <form id={`${type}-form`} action={submit} className="catalog-form">
    {type === "cliente" ? <><label><span>Nombre o razón social</span><input name="nombre" required placeholder="Distribuidora Norte" /></label><label><span>CUIT / DNI</span><input name="cuit" placeholder="30-71823456-1" /></label><label><span>Condición IVA</span><select name="condicionIva" defaultValue="Consumidor Final"><option>Consumidor Final</option><option>Responsable Inscripto</option><option>Monotributista</option><option>Exento</option></select></label><label><span>Domicilio</span><input name="domicilio" /></label><label><span>Localidad</span><input name="localidad" /></label><label><span>Teléfono</span><input name="telefono" type="tel" /></label><label><span>Email</span><input name="email" type="email" /></label></> : <><label><span>Código</span><input name="codigo" placeholder="PROD-001" /></label><label><span>Nombre</span><input name="nombre" required placeholder="Caja de tornillos" /></label><label><span>Descripción</span><input name="descripcion" /></label><label><span>Precio ARS</span><input name="precio" type="number" inputMode="decimal" min="0" step="0.01" defaultValue="0" /></label><label><span>Unidad</span><input name="unidad" defaultValue="u." /></label><label><span>Stock actual</span><input name="stockActual" type="number" inputMode="decimal" min="0" step="0.01" defaultValue="0" /></label><label><span>Stock mínimo</span><input name="stockMinimo" type="number" inputMode="decimal" min="0" step="0.01" defaultValue="0" /></label></>}
    <Button disabled={busy}>{busy ? "Guardando…" : type === "cliente" ? "Guardar cliente" : "Guardar producto"}</Button>
  </form>;
}
