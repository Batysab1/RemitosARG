import { getDocument } from "@/actions/documents";
import { documentHtml } from "@/lib/document-html";
import { PrintFrame } from "@/components/dashboard/PrintFrame";
import { requireSubscription } from "@/lib/guards";

export default async function PrintDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSubscription();
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return <main>No encontrado</main>;
  const html = documentHtml({
    tipo: doc.tipo,
    numero: doc.numero,
    fecha: doc.fecha,
    condVenta: doc.condVenta,
    validezDias: doc.validezDias,
    cliente: JSON.parse(doc.clienteSnapshot),
    emisor: JSON.parse(doc.emisorSnapshot),
    items: doc.items.map((item) => ({ codigo: item.codigo, descripcion: item.descripcion, cantidad: item.cantidad, unidad: item.unidad, precio: item.precio, descuento: item.descuento, ivaTasa: item.ivaTasa })),
    subtotal: doc.subtotal,
    iva: doc.iva,
    total: doc.total,
    observaciones: doc.observaciones,
  });
  return <PrintFrame html={html} backHref={`/dashboard/documentos/${id}`} />;
}
