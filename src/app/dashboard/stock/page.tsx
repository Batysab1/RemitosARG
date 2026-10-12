import { Warning } from "@phosphor-icons/react/dist/ssr";
import { getMovementStats, listMovements, listStock } from "@/actions/stock";
import { StockAdjustForm } from "@/components/dashboard/StockAdjustForm";
import { StockCharts } from "@/components/dashboard/StockCharts";
import { requireSubscription } from "@/lib/guards";

export default async function StockPage() {
  await requireSubscription();
  const [products, movements, stats] = await Promise.all([listStock(), listMovements(), getMovementStats()]);
  return <div className="dashboard-content"><div className="dashboard-heading"><div><p className="eyebrow">Operación</p><h1>Stock</h1><p>Movimientos claros para no perder ventas.</p></div></div><StockCharts daily={stats.daily} topSold={stats.topSold} totalIngresos={stats.totalIngresos} totalEgresos={stats.totalEgresos} /><section className="stock-grid"><div className="module-panel"><h2>Estado actual</h2><div className="stock-list">{products.length === 0 ? <p className="empty-copy">Cargá productos para ver el stock.</p> : products.map((p) => <div className="stock-row" key={p.id}><div><strong>{p.nombre}</strong><small>{p.codigo || "Sin código"}</small></div><span className={p.stockActual <= p.stockMinimo ? "stock-low" : "stock-ok"}>{p.stockActual} {p.unidad}{p.stockActual <= p.stockMinimo && <Warning size={15} />}</span><StockAdjustForm productId={p.id} /></div>)}</div></div><div className="module-panel"><h2>Últimos movimientos</h2><div className="data-list">{movements.length === 0 ? <p className="empty-copy">Todavía no hay movimientos.</p> : movements.map((m) => <div className="data-row" key={m.id}><div><strong>{m.tipo}</strong><small>{m.motivo || "Sin motivo"}</small></div><span className={m.tipo === "egreso" ? "movement-out" : "movement-in"}>{m.tipo === "egreso" ? "−" : "+"}{m.cantidad}</span></div>)}</div></div></section></div>;
}
