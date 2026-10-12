export function docTypeLabel(tipo: string) {
  if (tipo === "remito") return "Remito";
  if (tipo === "presupuesto") return "Presupuesto";
  if (tipo === "recibo") return "Recibo";
  return tipo;
}
