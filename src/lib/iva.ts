// Tasa de IVA por ítem. El valor -1 representa "Exento": calcula como 0%
// pero se muestra como "Ex." en documentos.
export const IVA_EXENTO = -1;

export const IVA_OPTIONS = [
  { value: 21, label: "IVA 21%" },
  { value: 10.5, label: "IVA 10,5%" },
  { value: 0, label: "IVA 0%" },
  { value: IVA_EXENTO, label: "Exento" },
] as const;

export function normalizeIvaTasa(tasa: number) {
  return tasa < 0 ? 0 : tasa;
}

export function ivaLabel(tasa: number) {
  if (tasa < 0) return "Ex.";
  if (tasa === 0) return "0%";
  return `${String(tasa).replace(".", ",")}%`;
}
