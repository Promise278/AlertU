# AlertU Backend

Professional campus-safety REST API for the AlertU Expo app. Built with Node.js, Express 5, Sequelize, PostgreSQL, Firebase Authentication, Firebase Cloud Messaging, and Google Maps Platform. The codebase is plain JavaScript (CommonJS) and uses top-level `config/`, `models/`, `migrations/`, `service/`, `controller/`, `routes/`, `validator/`, `middleware/`, and `util/` directories. There is no `src/` folder.

> **External services:** Firebase Auth/FCM and Google Maps require real project credentials. This repository contains the integration code, but those live provider calls cannot be verified without credentials. The Expo app in `../mobile` is wired to this API for local development.

## Features

- Firebase ID-token authentication with automatic user provisioning.
- Development-only bearer tokens for local Expo testing, disabled by default and rejected in production.
- Role-based access control: `student`, `moderator`, `admin`.
- Campus incident reports with optional server-side Google geocoding.
- Public incident feed with category, text, bounding-box, date, and pagination filters.
- Moderator queue, audited status decisions, incident merge, and incident split.
- Campus posts/gists/news/events with likes and comments.
- Idempotent likes and transactional denormalized like/comment counters.
- Durable notification outbox with deduplication, retry script, and FCM/Expo push delivery.
- Device push-token registration and per-user notification preferences.
- Google Maps geocoding and reverse geocoding endpoints (server-side key only).
- Zod request validation, centralized errors, request IDs, Pino logging with redaction.
- Helmet, explicit CORS allow-list, JSON body limits, and endpoint-specific rate limits.
- Official Sequelize CLI migrations and a default-campus seed.

## Requirements

- Node.js **22+** (Firebase Admin v14 requires Node 22; the project was developed and tested on Node 26).
- PostgreSQL 13+ (tested against PostgreSQL 18.6).
- A Firebase project with Authentication enabled.
- Optional: Firebase Cloud Messaging credentials and a Google Maps Geocoding API key.

## Quick start

```bash
cd backend
cp .env.example .env
# Edit .env with your database, Firebase, maps, and push settings.
npm install
npm run db:migrate
npm run db:seed
npm start
```

The API listens on `PORT` from `.env` (default `5000`). Check it with:

```bash
curl http://localhost:5000/health
curl http://localhost:5000/
```

Documentation is available in the repository:

- [`docs/API.md`](docs/API.md) — endpoint guide and examples.
- [`docs/openapi.yaml`](docs/openapi.yaml) — OpenAPI 3 contract.
- [`docs/MOBILE_INTEGRATION.md`](docs/MOBILE_INTEGRATION.md) — connecting the Expo app.

They are also served by the API under `/docs/` when the server is running.

## Environment configuration

Copy `.env.example` to `.env`. Never commit `.env`; it is ignored by Git.

### Database

Use either `DATABASE_URL` or the discrete `DB_*` values. `DATABASE_URL` wins when both are set, except that `DB_NAME` overrides the database name in the URL. Keep `DB_NAME=defaultdb` to prevent accidentally connecting to a different database.

- Local PostgreSQL: usually `DB_SSL=false`.
- Hosted PostgreSQL (for example Aiven): set `DB_SSL=true`.
- Prefer a CA bundle: put its base64 content in `DB_SSL_CA_BASE64` and keep `DB_SSL_REJECT_UNAUTHORIZED=true`.
- Only set `DB_SSL_REJECT_UNAUTHORIZED=false` when the provider uses a certificate chain you cannot supply. This disables certificate verification and weakens transport security.

Run the Sequelize CLI migrations before starting the API. No `sequelize.sync()` is used at runtime.

### Firebase Authentication

Provide one credential source:

1. `FIREBASE_SERVICE_ACCOUNT_JSON` — raw JSON or base64-encoded service-account JSON.
2. `GOOGLE_APPLICATION_CREDENTIALS` — absolute path to a service-account file.
3. `FIREBASE_AUTH_EMULATOR_HOST` — local Firebase Auth emulator only.

`FIREBASE_PROJECT_ID` is also required. Clients send a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

On the first authenticated request, the server creates a `student` user and assigns the only active campus when exactly one exists. Identity is never trusted from the request body.

If Firebase is not configured, protected routes return `503 AUTH_NOT_CONFIGURED` instead of silently accepting requests. This is intentional.

#### Local app testing without Firebase

To test the Expo app before a Firebase project is ready, set `DEV_AUTH_ENABLED=true` and a random `DEV_AUTH_TOKEN` of at least 24 characters in `.env`. The app then sends `Authorization: Bearer dev:<DEV_AUTH_TOKEN>`. This path is disabled by default, is rejected when `NODE_ENV=production`, and must be removed before hosting. See [`docs/MOBILE_INTEGRATION.md`](docs/MOBILE_INTEGRATION.md) for the matching mobile `.env.local` values and host rules.

### Push notifications

- `PUSH_PROVIDER=fcm` — Firebase Cloud Messaging (default).
- `PUSH_PROVIDER=expo` — Expo Push Service, useful for Expo development builds.
- `PUSH_PROVIDER=auto` — Expo tokens (`ExponentPushToken[...]` / `ExpoPushToken[...]`) use Expo; other tokens use FCM.
- `PUSH_ENABLED=false` records notification events but does not deliver them (useful for local development).

Notification events are written to `notification_events` in the same transaction as the domain change. Delivery is attempted asynchronously; failures are retried by `npm run notifications:retry`.

### Google Maps

`GOOGLE_MAPS_SERVER_API_KEY` is a **server-side** key with the Geocoding API enabled and restricted to the server. Never ship this key in the Expo app. The mobile app uses its own Maps SDK key restricted by Android package/iOS bundle ID. Without the server key, the maps status endpoint reports `configured: false` and geocoding returns `503 MAPS_NOT_CONFIGURED`.

## Database migrations and seed

```bash
npm run db:migrate          # apply all pending migrations
npm run db:migrate:undo     # undo the most recent migration
npm run db:seed             # insert the default campus (idempotent)
npm run db:reset            # undo all, migrate, seed (development only)
```

Migrations are additive and official (`sequelize-cli`). The baseline replaced an old, never-applied integer-ID scaffold after the target database was verified empty. Do not edit a migration that has already run in a shared environment; add a new one.

The seed creates `AlertU Campus` with a fixed UUID. The mobile app can use its `campusId` until real campus onboarding exists.

## Roles

New users are always `student`. Promote a user after they have signed in at least once:

```bash
npm run user:set-role -- user@campus.edu moderator
npm run user:set-role -- <firebaseUid> admin
npm run user:set-role -- <userId> student
```

The script updates the local profile only. Firebase custom claims are not required by this API; authorization reads the PostgreSQL role.

## Scheduled jobs

The API does not embed a scheduler. Run these from cron, a platform scheduler, or a worker:

```bash
npm run incidents:expire
npm run notifications:retry
```

- `incidents:expire` marks stale active incidents as `expired`, writes audit rows, and queues notifications.
- `notifications:retry` retries pending/failed/stale-processing notification events up to `NOTIFICATION_MAX_ATTEMPTS`.

## API overview

| Area | Endpoints |
| --- | --- |
| Health | `GET /health`, `GET /health/live` |
| Identity | `GET /me` |
| Reports | `POST /reports`, `GET /reports`, `GET /reports/:id` |
| Incidents | `GET /incidents`, `GET /incidents/:id`, `POST /incidents/:id/updates` |
| Moderation | `GET /moderation/queue`, `GET /moderation/reports`, `POST /moderation/incidents/:id/decision`, `POST /moderation/clusters/:id/merge`, `POST /moderation/clusters/:id/split` |
| Posts | `GET /posts`, `POST /posts`, `GET /posts/:id`, `DELETE /posts/:id` |
| Likes | `POST /posts/:id/like`, `DELETE /posts/:id/like` |
| Comments | `GET /posts/:id/comments`, `POST /posts/:id/comments`, `DELETE /posts/:id/comments/:commentId` |
| Devices | `GET /devices`, `POST /devices/push-token`, `DELETE /devices/push-token` |
| Preferences | `GET /notification-preferences`, `PUT /notification-preferences` |
| Maps | `GET /maps/status`, `POST /maps/geocode`, `POST /maps/reverse-geocode` |

All responses use an envelope: `{ "data": ... }`, plus pagination `meta` where relevant. Errors use `{ "error": { "code", "message", "details?" }, "requestId" }`.

## Security notes

- Helmet security headers, HSTS, frame denial, and no `X-Powered-By`.
- Explicit CORS allow-list; wildcard credentials are rejected in production.
- Global rate limit plus write, moderation, and maps limits. Health checks are exempt.
- Zod `.strict()` schemas reject unknown fields instead of silently accepting mass-assignment attempts.
- Sequelize parameterized queries; no raw string interpolation of user input.
- Pino redacts authorization/cookie/token/password/connection-string fields.
- Public incident coordinates are rounded to three decimals; exact incident coordinates require authentication. Reports and reporter identity are restricted to the owner or a moderator.
- Media are HTTPS URL references. This API does not accept binary uploads; add an object-storage service before accepting files.

## Deployment checklist

Any Node 22+ host works (Render, Railway, Fly.io, a VPS, or a container platform). The API is stateless; use the managed PostgreSQL instance for storage.

1. Set `NODE_ENV=production`, a strong `PORT` value if the platform requires it, and an explicit comma-separated `CORS_ORIGIN` (the production web/app origin). Wildcards are rejected.
2. Configure the database with `DATABASE_URL` or `DB_*`. Keep `DB_SSL=true` and `DB_SSL_REJECT_UNAUTHORIZED=true`, and supply the provider CA in `DB_SSL_CA_BASE64`.
3. Set `FIREBASE_PROJECT_ID` plus one credential source: `FIREBASE_SERVICE_ACCOUNT_JSON` (raw or base64) or `GOOGLE_APPLICATION_CREDENTIALS`. Never commit either value.
4. Set `DEV_AUTH_ENABLED=false`; startup rejects development tokens in production.
5. Optionally set `GOOGLE_MAPS_SERVER_API_KEY` for geocoding and `PUSH_PROVIDER` for delivery. Set `TRUST_PROXY` to the platform's proxy count or subnet when running behind a load balancer.
6. Run migrations and the seed **before** starting the API:

   ```bash
   npm ci --omit=dev
   npm run db:migrate
   npm run db:seed        # first deploy only; idempotent
   npm start
   ```

7. Schedule `npm run incidents:expire` (for example every 5 minutes) and `npm run notifications:retry` (for example every minute) as separate jobs. Run the retry job as a single worker when scaling horizontally.
8. Point the Expo app at the public HTTPS API with `EXPO_PUBLIC_API_URL`, then rebuild it. Localhost defaults are for development only.
9. Verify after deploy: `GET /health` returns `200` with `db: "up"`, `GET /maps/status` reflects your key, and an authenticated `GET /me` succeeds with a real Firebase token.

## Project layout

```
backend/
├── app.js                 # Express app factory and middleware
├── index.js               # startup, database check, graceful shutdown
├── config/                # env validation, Sequelize, Firebase, logging
├── constants/             # roles, incident taxonomy, transitions, device values
├── controller/            # HTTP controllers
├── middleware/            # auth, validation, rate limits, logging, errors
├── migrations/            # official Sequelize CLI migrations
├── models/                # Sequelize models and associations
├── routes/                # route wiring
├── scripts/               # role/bootstrap, expiry, notification retry
├── seeders/               # default campus seed
├── service/               # domain, moderation, posts, maps, push, notifications
├── util/                  # errors, async wrapper, serializers, pagination
├── validator/             # Zod request schemas
└── docs/                  # API, OpenAPI, mobile integration guide
```

## Known limitations

- Firebase Auth/FCM and Google Maps calls require real credentials; the local development-auth flow and mocked provider paths are available, but live provider calls have not been exercised.
- The Expo app is wired to the API for local testing. Real Firebase Auth/FCM, Google Maps, push registration, photo uploads, and a live map renderer still need provider credentials or additional implementation. See [`docs/MOBILE_INTEGRATION.md`](docs/MOBILE_INTEGRATION.md).
- Push delivery runs in-process and through a retry script. A production deployment with multiple API instances should run the retry job as a single scheduled worker or add a queue/lease.
- Incident geofencing uses latitude/longitude and a radius. PostGIS boundaries are not enabled.
- No refresh-token or password endpoint exists because Firebase clients own those flows.
