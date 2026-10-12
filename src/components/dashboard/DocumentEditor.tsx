"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Trash } from "@phosphor-icons/react";
import { createDocument, type DocumentItemInput, type DocumentType } from "@/actions/documents";
import { listClients, listProducts } from "@/actions/catalog";
import { getIssuer } from "@/actions/issuer";
import { documentHtml } from "@/lib/document-html";
import { IVA_OPTIONS, normalizeIvaTasa } from "@/lib/iva";
import { Button } from "@/components/ui/Button";

const COND_VENTA_OPTIONS = ["Contado", "Cuenta corriente", "Tarjeta", "Transferencia", "Cheque"];

export function EditorDocumento({ tipo }: { tipo: DocumentType }) {
  const [items, setItems] = useState<DocumentItemInput[]>([{ codigo: "", descripcion: "Producto de muestra", cantidad: 1, unidad: "u.", precio: 0, descuento: 0, ivaTasa: 21 }]);
  const [clienteId, setClienteId] = useState("");
  const [clients, setClients] = useState<Awaited<ReturnType<typeof listClients>>>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof listProducts>>>([]);
  const [issuer, setIssuer] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [condVenta, setCondVenta] = useState("Contado");
  const [validezDias, setValidezDias] = useState(15);
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    Promise.all([listClients(), listProducts(), getIssuer()]).then(([nextClients, nextProducts, nextIssuer]) => {
      setClients(nextClients);
      setProducts(nextProducts);
      setIssuer(nextIssuer ?? { razonSocial: "", nombreComercial: "", cuit: "", condicionIva: "", domicilio: "", localidad: "", telefono: "", logoData: null });
    });
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.cantidad * item.precio * (1 - item.descuento / 100), 0), [items]);
  const iva = useMemo(() => items.reduce((sum, item) => sum + item.cantidad * item.precio * (1 - item.descuento / 100) * normalizeIvaTasa(item.ivaTasa) / 100, 0), [items]);
  const total = subtotal + iva;

  const previewHtml = useMemo(() => {
    const client = clients.find((c) => c.id === clienteId);
    if (!issuer || !client) return "";
    return documentHtml({
      tipo,
      numero: 1,
      fecha,
      condVenta,
      validezDias,
      cliente: client as Record<string, unknown>,
      emisor: issuer,
      items,
      subtotal,
      iva,
      total,
      observaciones,
    });
  }, [tipo, clients, clienteId, issuer, items, subtotal, iva, total, fecha, condVenta, validezDias, observaciones]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const validItems = items.filter((item) => item.descripcion.trim() !== "");
      if (!clienteId) throw new Error("Elegí un cliente para el documento.");
      if (validItems.length === 0) throw new Error("Agregá al menos un ítem con descripción.");
      await createDocument({ tipo, fecha, clienteId, condVenta, validezDias, observaciones, items: validItems });
      router.push("/dashboard/documentos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el documento.");
    } finally {
      setBusy(false);
    }
  }

  function updateItem(index: number, patch: Partial<DocumentItemInput>) {
    setItems((current) => current.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function fillFromProduct(index: number, productId: string) {
    if (!productId) {
      updateItem(index, { productId: undefined, codigo: "", descripcion: "", unidad: "u.", precio: 0 });
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateItem(index, {
      productId: product.id,
      codigo: product.codigo || "",
      descripcion: product.nombre,
      unidad: product.unidad || "u.",
      precio: product.precio || 0,
    });
  }

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <div>
          <p className="eyebrow">Documento nuevo</p>
          <h1>{tipo === "remito" ? "Nuevo remito" : tipo === "presupuesto" ? "Nuevo presupuesto" : "Nuevo recibo"}</h1>
        </div>
        <Button onClick={submit} disabled={busy || !clienteId || items.length === 0}>{busy ? "Guardando…" : "Guardar documento"}</Button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="editor-grid">
        <section className="module-panel">
          <div className="editor-section-heading">
            <h2>Datos del documento</h2>
            <span><FileText size={17} />{tipo}</span>
          </div>

          <label>
            <span>Cliente</span>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Elegí un cliente</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.nombre}</option>)}
            </select>
          </label>

          <div className="editor-document-fields">
            <label>
              <span>Fecha</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </label>
            <label>
              <span>Condición de venta</span>
              <select value={condVenta} onChange={(e) => setCondVenta(e.target.value)}>
                {COND_VENTA_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            {tipo === "presupuesto" && (
              <label>
                <span>Validez (días)</span>
                <input type="number" min={0} value={validezDias} onChange={(e) => setValidezDias(Number(e.target.value))} />
              </label>
            )}
          </div>

          <label>
            <span>Observaciones</span>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} placeholder="Ej: entrega a convenir, precios sujetos a variación..." />
          </label>

          <div className="preview-issuer-note">
            {issuer && (issuer.razonSocial || issuer.nombreComercial) ? (
              <>
                <span>Los datos de tu empresa aparecen en el encabezado del documento.</span>
                <Link href="/dashboard/configuracion">Editar datos de tu empresa</Link>
              </>
            ) : (
              <>
                <span>Todavía no cargaste los datos de tu empresa.</span>
                <Link href="/dashboard/configuracion">Configurar ahora</Link>
              </>
            )}
          </div>
          <div className="document-preview-frame">
            {previewHtml ? (
              <iframe title="Vista previa" srcDoc={previewHtml} />
            ) : (
              <div className="document-preview-placeholder">Elegí un cliente para ver la vista previa</div>
            )}
          </div>
        </section>
        <section className="module-panel">
          <div className="editor-section-heading">
            <h2>Ítems</h2>
            <button className="icon-button" onClick={() => setItems((current) => [...current, { codigo: "", descripcion: "", cantidad: 1, unidad: "u.", precio: 0, descuento: 0, ivaTasa: 21 }])}><Plus size={17} /></button>
          </div>
          <div className="items-list">
            {items.map((item, index) => {
              const selectedProduct = item.productId ? products.find((p) => p.id === item.productId) : null;
              return (
                <div key={index} className="item-row">
                  <div className="item-product-select">
                    <select value={item.productId ?? ""} onChange={(e) => fillFromProduct(index, e.target.value)}>
                      <option value="">Escribir ítem manualmente</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{product.nombre} ({product.stockActual} {product.unidad})</option>
                      ))}
                    </select>
                    {selectedProduct && <span className="item-stock-hint">Stock: {selectedProduct.stockActual} {selectedProduct.unidad}</span>}
                  </div>
                  <input placeholder="Código" value={item.codigo} onChange={(e) => updateItem(index, { codigo: e.target.value })} />
                  <input placeholder="Descripción" value={item.descripcion} onChange={(e) => updateItem(index, { descripcion: e.target.value })} />
                  <div className="item-numbers">
                    <input type="number" min="0" step="0.01" value={item.cantidad} onChange={(e) => updateItem(index, { cantidad: Number(e.target.value) })} aria-label="Cantidad" />
                    <input placeholder="u." value={item.unidad} onChange={(e) => updateItem(index, { unidad: e.target.value })} aria-label="Unidad" />
                    <input type="number" min="0" step="0.01" value={item.precio} onChange={(e) => updateItem(index, { precio: Number(e.target.value) })} aria-label="Precio" />
                    <input type="number" min="0" max="100" step="0.01" value={item.descuento} onChange={(e) => updateItem(index, { descuento: Number(e.target.value) })} aria-label="Descuento %" />
                    <select value={item.ivaTasa} onChange={(e) => updateItem(index, { ivaTasa: Number(e.target.value) })} aria-label="IVA">
                      {IVA_OPTIONS.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
                    </select>
                    <button type="button" onClick={() => setItems((current) => current.filter((_, i) => i !== index))} aria-label="Quitar ítem"><Trash size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="editor-totals">
            <span>Subtotal {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(subtotal)}</span>
            <span>IVA {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(iva)}</span>
            <strong>Total {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(total)}</strong>
          </div>
        </section>
      </div>
    </div>
  );
}
