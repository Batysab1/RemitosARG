# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: Next.js App Router, TypeScript, Tailwind, Better Auth, Drizzle and SQLite, with server-side Puppeteer PDF generation. The application should remain migratable to PostgreSQL through `DATABASE_URL`.

## Users

Small and medium businesses in Argentina. The primary user manages customers, products, stock, remitos and presupuestos from a browser, often from a phone as well as a desktop.

## Product Purpose

Provide one Spanish rioplatense workspace for managing commercial data, tracking stock, and issuing professional remitos and presupuestos in ARS.

## Positioning

The product connects catalog data to documents: customers and products are entered once, then selected into a document with server-verified subscription access and stock movement tracking.

## Operating Context

Users work with Argentine CUIT/DNI, IVA conditions, ARS prices, stock movements, A4 commercial documents, PDF exports, printing and Mercado Pago subscriptions. The public site explains the product and pricing; the authenticated dashboard is an operational tool.

## Capabilities and Constraints

- Email and password registration, login and mocked password-reset emails through Better Auth.
- Paid subscription state is stored in the database and checked server-side in middleware, page guards and APIs.
- Mercado Pago recurring billing is prepared through a signed webhook and a manual test-state path.
- Customers, products, stock movements, remitos and presupuestos are persisted in SQL through Drizzle.
- IVA is selected per document item with 21%, 10.5%, 0% and exento options.
- PDF generation uses Puppeteer on the server and a shared HTML document template.
- The interface and copy are in Spanish rioplatense; prices are ARS.
- The public first visit includes a skippable 10 to 12 second intro stored in sessionStorage.
- Illustrative metrics and seed records must be clearly marked as demo data and must not become unverified commercial claims.

## Brand Commitments

- The visual language combines minimalist editorial structure, premium finish and Apple-inspired restraint.
- The accent is electric blue, consistent with the existing Remitos desktop product.
- Geist Sans and Geist Mono are preferred; no generic Inter/Roboto-first treatment.

## Evidence on Hand

- Existing desktop product at `E:\Bosemadafa\remitos-app` establishes Argentine remito terminology, document structure and electric-blue direction.
- No real logo, customer testimonials, production metrics or final Mercado Pago credentials were supplied. Do not fabricate them.

## Product Principles

- Catalog once, reuse everywhere.
- Keep document output professional, printable and faithful to stored snapshots.
- Make subscription boundaries clear without pretending locked modules do not exist.
- Server-side authorization is the source of truth.
- Prefer calm, purposeful motion over decoration.

## Accessibility & Inclusion

- Respect `prefers-reduced-motion`.
- Preserve browser zoom and keyboard access.
- Keep touch targets comfortable on mobile and avoid input zoom on iOS with 16px controls.
- Validate and explain errors inline in plain Spanish.
