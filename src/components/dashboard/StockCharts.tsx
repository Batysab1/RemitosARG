import type { DailyMovement, TopSold } from "@/actions/stock";

const BLUE = "#2563eb";
const ROSE = "#e11d48";
const LINE = "#e5e8e3";

function shortName(nombre: string, max = 24) {
  return nombre.length > max ? `${nombre.slice(0, max - 1)}…` : nombre;
}

function SoldChart({ topSold }: { topSold: TopSold[] }) {
  if (topSold.length === 0) return <p className="empty-copy">Todavía no hay egresos para graficar.</p>;
  const max = Math.max(...topSold.map((t) => t.unidades), 1);
  const rowH = 32;
  const labelW = 150;
  const barMax = 220;
  const valueW = 60;
  const width = labelW + barMax + valueW;
  const height = topSold.length * rowH + 8;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label="Productos más vendidos">
      {topSold.map((item, i) => {
        const y = 4 + i * rowH;
        const barW = Math.max(3, (item.unidades / max) * barMax);
        return (
          <g key={item.productId}>
            <text x={0} y={y + 15} className="chart-label">{shortName(item.nombre)}</text>
            <rect x={labelW} y={y + 4} width={barW} height={14} rx={4} fill={BLUE} opacity={0.35 + (0.65 * item.unidades) / max} />
            <text x={labelW + barW + 8} y={y + 15} className="chart-value">{item.unidades}</text>
          </g>
        );
      })}
    </svg>
  );
}

function FlowChart({ daily }: { daily: DailyMovement[] }) {
  const max = Math.max(...daily.map((d) => Math.max(d.ingresos, d.egresos)), 1);
  const groupW = 30;
  const barW = 10;
  const plotH = 150;
  const labelH = 22;
  const width = daily.length * groupW + 8;
  const height = plotH + labelH + 8;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label="Ingresos y egresos por día">
      {[0.25, 0.5, 0.75, 1].map((f) => {
        const y = 4 + plotH * (1 - f);
        return <line key={f} x1={0} x2={width} y1={y} y2={y} stroke={LINE} strokeWidth={1} />;
      })}
      {daily.map((d, i) => {
        const x = 4 + i * groupW;
        const hi = (d.ingresos / max) * plotH;
        const he = (d.egresos / max) * plotH;
        return (
          <g key={d.key}>
            <rect x={x} y={4 + plotH - hi} width={barW} height={Math.max(hi, 0)} rx={3} fill={BLUE}>
              <title>{`${d.label}: +${d.ingresos} ingresos`}</title>
            </rect>
            <rect x={x + barW + 3} y={4 + plotH - he} width={barW} height={Math.max(he, 0)} rx={3} fill={ROSE} opacity={0.85}>
              <title>{`${d.label}: −${d.egresos} egresos`}</title>
            </rect>
            {i % 2 === 0 && (
              <text x={x + barW} y={4 + plotH + 15} textAnchor="middle" className="chart-label chart-label-sm">{d.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function StockCharts({ daily, topSold, totalIngresos, totalEgresos }: { daily: DailyMovement[]; topSold: TopSold[]; totalIngresos: number; totalEgresos: number }) {
  const empty = totalIngresos === 0 && totalEgresos === 0 && topSold.length === 0;
  return (
    <div className="stock-charts">
      <section className="module-panel" aria-label="Productos vendidos">
        <div className="editor-section-heading">
          <h2>Productos vendidos</h2>
          <span>top 8 · 14 días</span>
        </div>
        {empty ? <p className="empty-copy">Todavía no hay movimientos para graficar.</p> : <SoldChart topSold={topSold} />}
      </section>
      <section className="module-panel" aria-label="Ingresos y egresos">
        <div className="editor-section-heading">
          <h2>Ingresos vs egresos</h2>
          <span>14 días</span>
        </div>
        {empty ? (
          <p className="empty-copy">Todavía no hay movimientos para graficar.</p>
        ) : (
          <>
            <FlowChart daily={daily} />
            <div className="chart-legend">
              <span><i className="chart-dot" style={{ background: BLUE }} />Ingresos ({totalIngresos})</span>
              <span><i className="chart-dot" style={{ background: ROSE }} />Egresos ({totalEgresos})</span>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
