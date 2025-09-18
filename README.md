# HELIOS Plattform (Step 2)

Diese Implementierung bildet das Grundgerüst der in [Step 2 – Gesamtanforderungen](docs/step-2-gesamtanforderungen.md) beschriebenen HELIOS Plattform. Der Fokus liegt auf einer modularen Next.js 14 Applikation mit App Router, typisierten Workspace-Packages und einem Docker-first Setup.

## Projektstruktur

```
├─ app/                     # Next.js App Router mit Modulen, Auth und API-Routen
├─ packages/                # Workspace-Packages (UI, Types, Utils, Dice-Engine, Realtime)
├─ services/                # Dedizierte Dienste (Realtime-Gateway)
├─ prisma/                  # Datenbankschema
├─ scripts/                 # Hilfsskripte (Seed, Migrate, Asset-Generator)
├─ tests/                   # Vitest-Grundlagen für weitere Abdeckung
├─ docker/                  # Container-Build & Compose Setup
└─ .github/workflows/ci.yml # GitHub Actions Pipeline
```

## Erste Schritte

```bash
corepack enable
pnpm install
pnpm dev
```

Weitere hilfreiche Befehle:

- `pnpm lint` – Next.js ESLint Regeln
- `pnpm typecheck` – TypeScript Strict Mode
- `pnpm test` – Vitest Unit Tests (Dice Engine)
- `pnpm build` – Produktionsbuild

## Docker Compose

```bash
cd docker
docker compose up --build
```

Dies startet App, PostgreSQL, Redis sowie das neue Realtime-Gateway inklusive PeerJS-Server. Die Applikation ist anschließend unter <http://localhost:3000> erreichbar.

## Workspace-Packages

- `@helios/types` – Zod Schemas & geteilte Typen
- `@helios/ui` – Tailwind-basierte UI-Komponenten für Auth, Hub, Dice, Map, Characters
- `@helios/utils` – Mock-Serverfunktionen, Logger, Query Client
- `@helios/dice-engine` – Deterministische Würfelsimulation (Three.js/Cannon-Placeholder)
- `@helios/realtime` – Browser-Client für PeerJS/Redis Gateway inkl. React-Provider
- `@helios/realtime-gateway` – Node-Service für WebSocket/PeerJS Signalisierung und Redis Pub/Sub

## Nächste Schritte

- Ersetzen der Mock-Daten durch Prisma Implementierung + Authentifizierung
- Integration von Three.js/Cannon-ES im Dice Canvas
- Verteilung von Session-Ereignissen über das Realtime-Gateway weiter ausbauen (Persistenz, RBAC)
- Ausbau von Tests (Integration, Playwright E2E) entsprechend der Spezifikation
