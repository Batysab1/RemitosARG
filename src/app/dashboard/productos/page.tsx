import { Trash } from "@phosphor-icons/react/dist/ssr";
import { deleteProduct, listProducts } from "@/actions/catalog";
import { CatalogForm } from "@/components/dashboard/CatalogForm";
import { requireSubscription } from "@/lib/guards";

const ars = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(value);

export default async function ProductsPage() {
  await requireSubscription();
  const rows = await listProducts();
  return <div className="dashboard-content"><div className="dashboard-heading"><div><p className="eyebrow">Catálogo</p><h1>Productos</h1><p>Precios y stock listos para tus documentos.</p></div></div><div className="module-grid"><section className="module-panel"><h2>Nuevo producto</h2><CatalogForm type="producto" /></section><section className="module-panel"><h2>{rows.length} productos</h2><div className="data-list">{rows.length === 0 ? <p className="empty-copy">Todavía no hay productos.</p> : rows.map((product) => <div className="data-row" key={product.id}><div><strong>{product.nombre}</strong><small>{product.codigo || "Sin código"} · {ars(product.precio)} · stock {product.stockActual}</small></div><form action={deleteProduct.bind(null, product.id)}><button aria-label={`Eliminar ${product.nombre}`}><Trash size={16} /></button></form></div>)}</div></section></div></div>;
}
