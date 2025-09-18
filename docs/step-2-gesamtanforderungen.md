# Step 2 – Gesamtanforderungen für den Neubau der HELIOS Plattform

Diese Spezifikation beschreibt den kompletten Funktionsumfang und die technische Zielarchitektur, um den HELIOS Dice Roller samt Authentifizierungs-Hub, Karten- und Charaktertool in einem einzelnen Entwicklungszyklus neu aufzubauen. Sie bildet die Grundlage für Implementierung, Tests, Deployment und spätere Erweiterungen.

## 1. Zielbild & Scope
- **Modulare Plattform**: Ein einziger Next.js-Monolith bündelt Authentifizierung, Session-Hub und die drei Kernmodule (Dice, Map, Characters) jeweils mit Spieler- und GM-Ansicht.
- **Gemeinsame Identität**: Nutzende melden sich einmalig an und wechseln ohne erneuten Login zwischen allen Modulen derselben Session.
- **Realtime Collaboration**: Alle Aktionen (Würfe, Karteninteraktionen, Charakteränderungen) werden in Echtzeit mit konsistenter Rechteprüfung synchronisiert.
- **Docker-first**: Lokale Entwicklung, Tests und Produktion laufen innerhalb reproduzierbarer Container-Umgebungen.

## 2. Technologiestack & Infrastruktur
- **Framework**: Next.js 14 (App Router) mit React 18 und Server/Client Components.
- **Programmiersprache**: TypeScript (strict). Shared Typen via `@helios/types` Workspace-Package.
- **Styling**: Tailwind CSS + Radix UI, thematisiert über Design Tokens.
- **State/Data Layer**: React Query für Client-Fetching, Zustand in Server Components. Persistenz via Prisma ORM auf PostgreSQL.
- **Realtime**: PeerJS/WebRTC für P2P, Signalisierung über WebSocket Gateway (Node/Express oder Next.js Route Handler) mit Redis Pub/Sub.
- **3D Engine**: Three.js für Rendering, Cannon-ES für Physik des Dice-Moduls.
- **Build & Tooling**: pnpm Workspaces, ESLint, Prettier, Playwright, Vitest, Storybook, commitlint/Husky.
- **Observability**: OpenTelemetry-Instrumentierung, Sentry für Frontend/Backend, Grafana/Prometheus optional.
- **Deployment**: Docker Multi-Stage Images, orchestrierbar via Kubernetes oder Docker Compose; Reverse Proxy (Traefik oder Nginx) terminates TLS.

## 3. Projekt- & Verzeichnisstruktur
```
helios-platform/
├─ app/                        # Next.js App Router Bäume
│  ├─ layout.tsx               # Root Layout, Theming, Auth Guard
│  ├─ page.tsx                 # Service-Hub (Modulübersicht)
│  ├─ (auth)/                  # Login/Registration/Passwort-Reset
│  │  ├─ login/page.tsx
│  │  ├─ register/page.tsx
│  │  └─ reset/page.tsx
│  ├─ (dashboard)/sessions/    # Session-Lifecycle UI
│  │  ├─ page.tsx              # Sessionübersicht
│  │  └─ [sessionId]/page.tsx  # Session-Detail + Modul-Launcher
│  ├─ dice/
│  │  ├─ layout.tsx            # Shared Layout für Spieler/GM
│  │  ├─ page.tsx              # Spieler-Ansicht
│  │  ├─ gm/page.tsx           # GM-/OBS-Ansicht
│  │  └─ actions/              # Server Actions (Persistenz, Validation)
│  ├─ map/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx              # Spieler-Ansicht
│  │  ├─ gm/page.tsx           # GM-Ansicht
│  │  └─ actions/
│  ├─ characters/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx              # Spieler-Ansicht
│  │  ├─ gm/page.tsx
│  │  └─ actions/
│  └─ api/                     # Route Handler
│      ├─ auth/
│      ├─ sessions/
│      ├─ realtime/
│      └─ uploads/
├─ packages/
│  ├─ ui/                      # Design System
│  ├─ types/                   # Zentrale Schemas/Typen (zod)
│  ├─ dice-engine/             # Three.js/Cannon-ES Setup, Texturen
│  ├─ realtime/                # PeerJS-Wrapper, Message Broker
│  └─ utils/                   # Allgemeine Helper (logger, config)
├─ prisma/
│  ├─ schema.prisma            # Datenbankmodell
│  └─ migrations/
├─ public/
│  ├─ textures/
│  ├─ sounds/
│  └─ icons/
├─ scripts/
│  ├─ seed.ts
│  ├─ migrate.ts
│  └─ generate-assets.ts
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ docker/
│  ├─ Dockerfile
│  ├─ docker-compose.yml
│  └─ entrypoint.sh
├─ .github/workflows/
├─ next.config.mjs
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.json
└─ README.md
```

## 4. Funktionale Anforderungen

### 4.1 Authentifizierung & Identitätsmanagement
- Unterstützt Login (E-Mail/Passwort), Registrierung mit E-Mail-Verifikation, Passwort-Reset, optionale OAuth-Provider.
- Sessions werden über httpOnly Cookies (Access + Refresh Token) verwaltet; Tokens enthalten Rollen (`PLAYER`, `GM`, `ADMIN`) und Modul-Berechtigungen.
- Profilverwaltung: Anzeigename, Avatar-URL, Theme-Farbe, bevorzugte Würfel-Presets. Änderungen sind sofort sichtbar und werden in allen Modulen synchronisiert.
- RBAC-Middleware schützt Server Actions und API-Routen; unberechtigte Zugriffe führen zu 403 und Logging.

### 4.2 Service-Hub & Navigation
- Nach Login zeigt der Hub verfügbare Module mit Status (aktiv, in Wartung, Coming Soon) und Session-Kachel mit Kontext (Teilnehmer, letzter Aktivitätszeitpunkt).
- Benutzer können neue Sessions erstellen, bestehende beitreten, Favoriten markieren und direkt in Spieler- oder GM-Ansichten starten.
- Modulwechsel erfolgt mittels zentralem Router, der Session-ID, Rolle und Modul-spezifischen Context (z. B. aktiver Charakter) übergibt, ohne erneutes Laden des Browsers.

### 4.3 Session-Management
- Session-Lifecycle: Erstellen, Bearbeiten (Name, Beschreibung, aktivierte Module), Archvieren, Schließen.
- Einladungssystem: generierte Join-Links, QR-Codes, optional E-Mail-Einladung.
- Teilnehmerverwaltung: GM kann Rollen zuweisen/ändern, Spieler entfernen, Sitzungsnotizen hinterlegen.
- Persistenz von Verlauf: Speicherung der letzten N Roll-Events, Kartenzustände, Charakteränderungen mit Zeitstempel.

### 4.4 Dice-Modul (Spieler)
- UI für Würfelpool: Attribute, Fertigkeit, Bonus, Stress, Spezialwürfel; Validierung gegen modulare Regeln (max. Pool, min. Stresswürfel bei Panik).
- Aktionen: Wurf auslösen, Reroll (einmalig pro Result), Würfel löschen, Presets speichern/abrufen, Sound- und Animationstoggle.
- Ergebnisdarstellung: Kategorisierte Listen (Erfolge, neutrale Würfel, Patzer), Hervorhebungen (6 = Erfolg, ≥2×6 = kritisch, 1 auf Stress = Panik), Hinweise für GM-Anforderungen.
- Responsive Layout mit Mobile-first Design, Tastaturnavigation und Screenreader-Labels.

### 4.5 Dice-Modul (GM)
- Dedizierte Ansicht mit Roll-Log, Filter (nach Spielern, Zeitraum, Ergebnistyp), Markierung für Rerolls und Clear-All.
- OBS-Modus: schlanker Theme, konfigurierbarer Kontrast, Hotkeys zum Ein-/Ausblenden von Spalten.
- Moderationsaktionen: Broadcast-Nachrichten, Zwangs-Panikwurf triggern, globale Clear-Aktion.

### 4.6 Würfelsimulation & Engine
- 3D-Szene mit dynamischer Kamera, adaptivem Spielfeld, konfigurierbaren Materialien und Lichteffekten.
- Physik initialisiert pro Wurf mit zufälligem Seed (optional deterministisch für Replays); Ergebnisse werden nach Stabilisierung abgelesen.
- Fehlerhandling: Fällt Physik aus (z. B. fehlendes WebGL), wechselt UI auf textbasierte Simulation mit identischen Regeln.

### 4.7 Map-Modul (Grundausbau)
- Kartenbibliothek mit Upload (Bild/PDF), Layer-Verwaltung (Fog-of-War, Tokens), Positions- und Sichtlinien-Tools.
- Spieleransicht: Echtzeit-Update der GM-Bewegungen, begrenzte Interaktion (z. B. Marker setzen, Ping).
- GM-Ansicht: Vollzugriff auf Layer, Token-Rechte, Snap-to-Grid, Szenenspeicher.

### 4.8 Charakter-Modul (Grundausbau)
- Charakterlisten pro Session mit Suche, Sortierung und Rollenzuweisung.
- Formular für Attribut-/Fertigkeitswerte, Ausrüstung, Zustände; Validierung gegen HELIOS-Regeln.
- Export/Import (JSON), Schnellübertragung von Attributen in den Dice-Würfelpool.

### 4.9 Shared Services
- Globaler Chat (Text, privat, GM-only), Notification-System (Toasts, Banner), Aktivitätslog.
- Presence-Anzeige: Wer ist online, wer tippt, wer würfelt.
- Dateiablage für Session-Assets (z. B. Charakterbögen) mit Berechtigungen.

### 4.10 Realtime & Netzwerk
- Nachrichtenarten: `sessionState`, `rollInitiate`, `rollResult`, `rollClear`, `nameUpdate`, `mapUpdate`, `characterUpdate`, `chatMessage`, `moduleSwitch`, `heartbeat`.
- Garantierte Zustellung via Retry/ACK-Mechanismus, Deduplikation mittels TTL Cache.
- Wiederverbindung: Clients erhalten vollständigen Session-Snapshot (letzte Würfe, Map-Status, Chat-Verlauf).
- Sicherheit: Nachrichtensignaturen (HMAC mit Session-Key), Rate Limits pro User, Audit-Log aller administrativen Aktionen.

### 4.11 Administration & Analytics
- Admin-Dashboard: Nutzerverwaltung, Session-Monitoring, Metriken (aktive Sessions, Durchschnittliche Latenz, Fehlerquote).
- Konfigurationsflags: Feature Toggles für Beta-Funktionen, Rollout-Kontrolle.

## 5. Nicht-funktionale Anforderungen
- **Performance**: Dice-Rendering ≥60 FPS bei ≤20 Würfeln; LCP < 2,5s auf Standardhardware; Realtime roundtrip <200 ms in EU.
- **Verfügbarkeit**: Ziel 99,5 % Uptime; automatisierte Wiederanläufe bei Container-Failures; Health Checks für Next.js und Realtime-Gateway.
- **Sicherheit**: TLS überall, CSP, Secure/HttpOnly Cookies, Passwort-Hashing mit Argon2id, Brute-Force-Protection, DSGVO-konforme Consent- und Datennutzungs-Workflows.
- **Zugänglichkeit**: WCAG 2.1 AA, Screenreader- und Tastaturunterstützung, Farbkontraste, Lokalisierung (Deutsch, Englisch) via i18next.
- **Wartbarkeit**: Modulgrenzen strikt, Shared Libraries dokumentiert, Storybook für UI-Komponenten, ADRs für Architekturentscheidungen.

## 6. Datenmodelle (Prisma-Schema-Auszug)
- **User**: `id`, `email`, `passwordHash`, `displayName`, `avatarUrl`, `theme`, `roles[]`, `createdAt`, `updatedAt`.
- **Session**: `id`, `ownerId`, `name`, `status`, `modulesEnabled[]`, `createdAt`, `archivedAt`.
- **Participant**: `id`, `sessionId`, `userId`, `role`, `joinedAt`, `lastSeenAt`.
- **RollLog**: `id`, `sessionId`, `userId`, `dice[]`, `results`, `successes`, `crit`, `panic`, `rerollChainId`, `createdAt`.
- **MapState**: `id`, `sessionId`, `stateJson`, `updatedAt`.
- **Character**: `id`, `sessionId`, `ownerId`, `name`, `attributesJson`, `inventoryJson`, `status`, `updatedAt`.
- **ChatMessage**: `id`, `sessionId`, `senderId`, `channel`, `content`, `visibility`, `createdAt`.
- **AuditLog**: `id`, `actorId`, `action`, `payload`, `createdAt`.

## 7. Schnittstellen & Verträge
- **REST/HTTP**
  - `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`, `POST /api/auth/logout`.
  - `GET /api/sessions`, `POST /api/sessions`, `GET /api/sessions/:id`, `PATCH /api/sessions/:id`, `POST /api/sessions/:id/invite`.
  - `GET /api/sessions/:id/participants`, `PATCH /api/sessions/:id/participants/:participantId`.
  - `GET /api/sessions/:id/rolls`, `POST /api/sessions/:id/rolls/preset`.
  - `POST /api/uploads` (signierte URLs für Assets).
- **Realtime (WebSocket/WebRTC DataChannel)**
  - Authentifizierung über Signaling-Token (`POST /api/realtime/token`).
  - Event-Schema validiert mit zod; Versionierung über `meta.schemaVersion`.
  - Heartbeat alle 20s, Timeout nach 60s ohne Antwort.
- **Server Actions**
  - `createSession`, `updateSession`, `submitRoll`, `clearRolls`, `savePreset`, `updateCharacter`, `updateMapLayer` etc. – alle mit RBAC-Checks.

## 8. DevOps & Deployment
- Multi-Stage Dockerfile (Builder: Node 20 + pnpm install, Runner: Alpine + node user).
- `docker-compose` für lokale Dev-Umgebung (App, PostgreSQL, Redis, PeerJS Signaler).
- CI/CD Pipeline (GitHub Actions): Lint → Unit Tests → Integration Tests (mit Docker Compose) → Playwright E2E → Build Docker Image → Push Registry → Deploy.
- Environment Management: `.env.example`, Vault/Secrets Manager, Feature Flags via Config Service.
- Migration Pipeline: `prisma migrate deploy` beim Containerstart, Seed-Skript optional in Dev.

## 9. Entwicklungs- & Teststrategie
- **Unit Tests**: Würfellogik, Session-Reducer, Utility-Funktionen (Vitest, 90 % Coverage-Ziel für Kernmodule).
- **Integrationstests**: Auth-Flow, Server Actions, Datenbankzugriffe (Vitest + Prisma Test DB).
- **E2E Tests**: Playwright-Szenarien (Login, Session erstellen, Spieler tritt bei, Würfelwurf synchronisiert, GM Clear).
- **UI Tests**: Storybook + Chromatic/Screenshot-Diffs für kritische Komponenten.
- **Performance Tests**: Lighthouse, WebRTC-Latency-Checks, Loadtests für Signaling.
- **QA Gates**: Branch Protection mit Pflicht-Checks, manuelle Review-Checkliste.

## 10. Projektphasen & Deliverables
1. **Grundgerüst (Sprint 1-2)**: Next.js Setup, Auth-Flow, Datenbank, Docker, CI/CD Skeleton.
2. **Session & Hub (Sprint 3-4)**: Dashboard, Session-Modelle, Navigation, Basis-Chat.
3. **Dice MVP (Sprint 5-6)**: Würfel-UI, Engine, Realtime-Basis, GM-Log.
4. **Map & Characters (Sprint 7-9)**: Grundfunktionen, Datenmodelle, Synchronisation.
5. **Cross-Module & Polish (Sprint 10-11)**: Presets, Module-übergreifender Context, Localization, Accessibility.
6. **Hardening & Release (Sprint 12)**: Load/Chaos Tests, Security Audit, Dokumentation, Beta-Launch.

## 11. Abschlusskriterien
- Alle Module erfüllen funktionale Anforderungen und sind via Docker-Compose startbar.
- CI/CD-Pipeline läuft grün, Tests & Lint bestehen, Mindest-Coverage erreicht.
- Dokumentation (README, ADRs, API-Referenz) ist aktuell und vollständig.
- Produktionstauglicher Build mit Monitoring-Integration und Rollback-Strategie.

Diese Anforderungen decken sämtliche Aspekte ab, um die HELIOS-Plattform in einem End-to-End-Durchlauf umzusetzen und zukünftige Erweiterungen nahtlos zu integrieren.
