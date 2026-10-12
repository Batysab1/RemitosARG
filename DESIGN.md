# Design System

## Direction

Gestión Comercial es una herramienta argentina de operación diaria: la interfaz pública persuade con claridad editorial y el panel prioriza lectura, velocidad y confianza. El sistema usa una base de papel cálido, tinta azul marino y un azul eléctrico único como señal de acción.

## Tokens

- Canvas: `#F7F6F2`
- Surface: `#FFFEFA`
- Ink: `#172235`
- Muted: `#687487`
- Line: `#E5E8E3`
- Accent: `#2563EB`
- Dark canvas: `#0D1726`
- Dark surface: `#142238`
- Sans: Geist Sans
- Data: Geist Mono
- Radius: 7px controls, 12px cards
- Motion: `transform` and `opacity`, `cubic-bezier(0.23, 1, 0.32, 1)`, reduced-motion fallback

## Components

- Public navigation is a light floating-free editorial bar, not a sticky capsule.
- Primary buttons are dark ink or blue-accent actions with 44px minimum touch height.
- Cards use a single hairline border and one diffuse shadow; no nested card stacks.
- The dashboard uses a persistent sidebar on desktop and horizontal navigation on small screens.
- The public intro is the only deliberate long-form animation; operational surfaces stay crisp.

## Accessibility

- All motion honors `prefers-reduced-motion`.
- Inputs remain at least 16px on mobile.
- Focus states use a blue ring and preserve keyboard visibility.
- The layout keeps browser zoom enabled and uses `dvh` for viewport-sensitive surfaces.
