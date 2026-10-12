# Gestión Comercial

Aplicación web en español rioplatense para stock, clientes, productos, remitos, presupuestos y recibos en ARS.

## Stack

Next.js App Router + TypeScript + Tailwind + Better Auth + Drizzle + Turso/SQLite. Puppeteer genera PDFs A4 en el server (Chrome local en dev, `@sparticuz/chromium` en Vercel).

## Desarrollo

```powershell
npm install
Copy-Item .env.example .env.local
npm run db:push
npm run db:seed
npm run dev
```

`BETTER_AUTH_SECRET` debe tener al menos 32 caracteres reales. El reset de contraseña es simulado: el enlace aparece en la consola del servidor. Para producción configurá un proveedor de email.

## Flujos de prueba

- Landing: abrir `/`, esperar la intro o usar `Saltar intro`, revisar scroll reveals, planes y responsive.
- Auth: `/registro`, crear usuario con contraseña de mínimo 10 caracteres, luego `/login`. El seed carga datos de negocio, pero no crea una contraseña demo.
- Suscripción: el seed crea una suscripción activa para `demo-user-gestion-comercial`. La activación real se actualiza desde el webhook de Mercado Pago.
- Clientes: `/dashboard/clientes`, crear y eliminar registros.
- Productos: `/dashboard/productos`, revisar precio, stock y stock mínimo.
- Stock: `/dashboard/stock`, cargar ingresos y revisar movimientos.
- Documentos: `/dashboard/documentos/nuevo`, elegir remito/presupuesto, guardar y luego abrir `/dashboard/documentos`.
- PDF: `GET /api/documentos/{id}/pdf` cuando exista un documento.
- Mobile: probar 390px y un teléfono real; los inputs usan 16px para evitar zoom en iOS.

## Mercado Pago

Definí `MERCADOPAGO_WEBHOOK_SECRET` y completá `src/app/api/webhooks/mercadopago/route.ts` con las credenciales y validación de firma de tu cuenta. El estado `subscriptions.status` es la fuente de verdad del acceso.

## Verificación

```powershell
npm run build
npm run lint
```

## Deploy a Vercel

1. Subí el repo a GitHub (sin `.env` ni `*.db`: ya están ignorados) e importalo en Vercel.
2. En Vercel: Settings > Environment Variables, agregá para Production:
   - `DATABASE_URL` (URL libsql de Turso)
   - `DATABASE_AUTH_TOKEN` (token de Turso)
   - `BETTER_AUTH_SECRET` (nuevo: `openssl rand -base64 32`)
   - `BETTER_AUTH_URL=https://<tu-proyecto>.vercel.app`
   - `NEXT_PUBLIC_APP_URL=https://<tu-proyecto>.vercel.app`
   - `ADMIN_EMAILS` (emails admin separados por coma)
   - No definir `CHROME_PATH` (solo dev local).
3. Deploy. La región es `gru1` (San Pablo, junto a Turso) vía `vercel.json`.
4. Entrá a `/registro`, creá tu usuario y, si no es admin, aprobalo desde `/dashboard/admin/pedidos` con la cuenta admin.

Notas: el PDF usa Chromium serverless (frío de unos segundos la primera vez). La ruta declara `maxDuration: 60`: si tu plan recorta el tiempo, el PDF de documentos muy largos puede cortarse; en ese caso subí el plan o achicá el contenido por página.
