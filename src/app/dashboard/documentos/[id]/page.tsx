import Link from "next/link";
import { ArrowDown, ArrowLeft, Printer } from "@phosphor-icons/react/dist/ssr";
import { getDocument } from "@/actions/documents";
import { PresupuestoActions } from "@/components/dashboard/PresupuestoActions";
import { requireSubscription } from "@/lib/guards";
import { docTypeLabel } from "@/lib/doc-label";
import { ivaLabel } from "@/lib/iva";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSubscription();
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return <div className="dashboard-content"><h1>Documento no encontrado</h1></div>;
  const client = JSON.parse(doc.clienteSnapshot) as { nombre: string; cuit?: string; domicilio?: string };
  return <div className="dashboard-content"><Link href="/dashboard/documentos" className="text-link"><ArrowLeft size={16} /> Volver al historial</Link><div className="dashboard-heading document-detail-heading"><div><p className="eyebrow">{docTypeLabel(doc.tipo)}</p><h1>{docTypeLabel(doc.tipo)} {String(doc.numero).padStart(8, "0")}</h1><p>{doc.fecha} · {doc.estado}{doc.condVenta ? ` · ${doc.condVenta}` : ""}{doc.tipo === "presupuesto" && doc.validezDias ? ` · Validez ${doc.validezDias} días` : ""}</p></div><div className="document-actions"><a className="button button-primary" href={`/api/documentos/${doc.id}/pdf`}><ArrowDown size={16} /> Descargar PDF</a><a className="button button-quiet" href={`/dashboard/documentos/${doc.id}/imprimir`}><Printer size={16} /> Imprimir</a></div></div><PresupuestoActions docId={doc.id} tipo={doc.tipo} estado={doc.estado} /><section className="module-panel document-detail-card"><div className="detail-client"><small>CLIENTE</small><strong>{client.nombre}</strong><span>{client.cuit} · {client.domicilio}</span></div><table className="document-items-table"><thead><tr><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>IVA</th><th>Importe</th></tr></thead><tbody>{doc.items.map((item) => <tr key={item.id}><td>{item.descripcion}</td><td>{item.cantidad} {item.unidad}</td><td>{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(item.precio)}</td><td>{ivaLabel(item.ivaTasa)}</td><td>{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(item.cantidad * item.precio)}</td></tr>)}</tbody></table>{doc.observaciones && <div className="detail-observations"><strong>Observaciones</strong><p>{doc.observaciones}</p></div>}<div className="detail-total"><span>Subtotal</span><strong>{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(doc.subtotal)}</strong><span>IVA</span><strong>{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(doc.iva)}</strong><span>Total</span><strong>{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(doc.total)}</strong></div></section></div>;
}
