import Link from "next/link";
import { ArrowUpRight, FileText } from "@phosphor-icons/react/dist/ssr";
import { listDocuments } from "@/actions/documents";
import { requireSubscription } from "@/lib/guards";
import { docTypeLabel } from "@/lib/doc-label";

export default async function DocumentsPage() {
  await requireSubscription();
  const rows = await listDocuments();
  return <div className="dashboard-content"><div className="dashboard-heading"><div><p className="eyebrow">Documentos</p><h1>Remitos, presupuestos y recibos</h1><p>Historial de lo que ya salió de tu operación.</p></div><Link href="/dashboard/documentos/nuevo" className="button button-primary">Nuevo documento <ArrowUpRight size={16} /></Link></div><section className="module-panel documents-panel"><div className="data-list">{rows.length === 0 ? <p className="empty-copy">Todavía no hay documentos emitidos.</p> : rows.map((row) => <Link href={`/dashboard/documentos/${row.id}`} className="data-row document-row" key={row.id}><FileText size={18} className="document-icon" /><div><strong>{docTypeLabel(row.tipo)} {String(row.numero).padStart(8, "0")}</strong><small>{row.fecha} · {row.estado}</small></div><span>{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(row.total)}</span></Link>)}</div></section></div>;
}
