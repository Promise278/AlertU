# Connecting the Expo App to the AlertU API

> **Outdated (2026-11-03):** this document describes the earlier local/dev-auth setup and mock-data screens. The current app uses Firebase Google Sign-In and the hosted backend at `https://alertu.onrender.com`. For the current, frontend-ready contract, use [`FRONTEND_API_GUIDE.md`](FRONTEND_API_GUIDE.md) and [`openapi.live.yaml`](openapi.live.yaml).

The Expo app in `../mobile` is wired to this API for authentication, profiles, reports, incidents, map markers, campus posts, likes, comments, and profile statistics. This guide covers the local setup, what is implemented, and what still needs production credentials.

> **Not live-configured:** Firebase Auth/FCM, Google Maps geocoding, a live map renderer, push registration, and photo uploads. The local development token path lets you test the rest of the app without Firebase credentials.

## 1. Run the backend locally

Prerequisites: Node.js 20.19+ and PostgreSQL 13+.

```bash
cd backend
cp .env.example .env
# Edit the database settings and add the local dev-auth values below.
npm install
npm run db:migrate
npm run db:seed
npm start
```

Add these values to `backend/.env` for local app testing:

```dotenv
PORT=5000
NODE_ENV=development

DEV_AUTH_ENABLED=true
DEV_AUTH_TOKEN=<openssl rand -hex 32>
DEV_AUTH_UID=dev-local-user
DEV_AUTH_NAME=Promise
DEV_AUTH_EMAIL=promise@campus.edu
```

Confirm the API and the development identity:

```bash
curl http://localhost:5000/health
curl -H "Authorization: Bearer dev:<DEV_AUTH_TOKEN>" http://localhost:5000/me
```

Safety rules enforced by the backend:

- `DEV_AUTH_ENABLED` defaults to `false`.
- `DEV_AUTH_TOKEN` must be at least 24 characters when enabled.
- Both `DEV_AUTH_ENABLED` and `FIREBASE_AUTH_EMULATOR_HOST` are rejected when `NODE_ENV=production`.
- The development verifier only accepts the exact `dev:<token>` bearer value and uses a timing-safe comparison.
- On first use, the server provisions the user and assigns the only active campus when exactly one exists.

## 2. Configure the mobile app

```bash
cd mobile
cp .env.example .env.local
```

Set the token in `mobile/.env.local`. It must be the `dev:` prefix followed by the same `DEV_AUTH_TOKEN` value from the backend:

```dotenv
EXPO_PUBLIC_DEV_AUTH_TOKEN=dev:<same DEV_AUTH_TOKEN value>
```

API host defaults are chosen in `mobile/src/lib/api.ts`:

| Client | Default API URL |
| --- | --- |
| Expo web | `http://localhost:5000` |
| iOS simulator | `http://localhost:5000` |
| Android emulator | `http://10.0.2.2:5000` |
| Physical phone | Set `EXPO_PUBLIC_API_URL=http://<computer-LAN-IP>:5000` |

Only set `EXPO_PUBLIC_API_URL` when the platform default is wrong. A physical phone cannot reach your computer through `localhost`, and the backend must be reachable on the LAN.

Expo web origins `http://localhost:8081`, `http://localhost:8082`, and `http://localhost:5173` are in the default development CORS allow-list. Add the origin you actually use, or configure `CORS_ORIGIN` explicitly.

Start the app:

```bash
cd mobile
npx expo start
```

`.env.local` is gitignored by `.env*.local`. Never commit the development token.

## 3. Authentication modes

`mobile/src/context/auth.tsx` supports three modes:

| Configuration | Behavior |
| --- | --- |
| Firebase client keys present | Firebase Auth (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`) plus `GET /me`. Sessions persist through AsyncStorage on native. |
| No Firebase keys, `EXPO_PUBLIC_DEV_AUTH_TOKEN` present | The API client sends the development bearer token and loads the local profile from `/me`. The login/signup screens say local test mode is active. |
| Neither configured | Authentication actions show a configuration error. Protected API calls fail with `AUTH_REQUIRED`. |

Local mode signs in automatically at app startup with the configured development identity. Signing out clears the in-memory profile; reloading the app signs in again.

Relevant files:

- `src/lib/firebase.ts` — Firebase app/auth setup, native persistence, optional Auth emulator.
- `src/lib/api.ts` — API URL resolution, bearer-token injection, `ApiError`, fetch wrapper.
- `src/context/auth.tsx` — auth state, `/me` profile, local mode.

For real Firebase testing, set the `EXPO_PUBLIC_FIREBASE_*` values from `mobile/.env.example`, enable Email/Password in the Firebase project, and configure the backend service account. The Firebase Auth emulator can be used with `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST`.

## 4. API client behavior

`api<T>(path, options)` in `src/lib/api.ts`:

- Resolves `API_URL` per platform or from `EXPO_PUBLIC_API_URL`.
- Sends `Accept: application/json` and JSON request bodies.
- Uses the current Firebase ID token when Firebase is configured, otherwise the development token.
- Supports `auth: false` and `auth: 'optional'` for public endpoints.
- Converts API error envelopes into `ApiError` with `status`, `code`, and `details`.
- Produces a clear `NETWORK_ERROR` when the API cannot be reached, including the configured URL.

## 5. Screen mapping (implemented)

| Screen | API calls |
| --- | --- |
| `login.tsx`, `signup.tsx` | Firebase Auth or local dev auth, then `GET /me`. |
| `(tabs)/home.tsx` | `GET /incidents?limit=1`, `GET /posts?limit=6&sort=latest`. |
| `(tabs)/map.tsx` | `GET /incidents?includeResolved=false&limit=50`; markers use real coordinates. |
| `incident.tsx` | `GET /incidents/:id`, related incidents from `GET /incidents`. |
| `(tabs)/pulse.tsx` | `GET /posts?type=gist&sort=latest|popular&limit=50`; like/unlike and comments. |
| `(tabs)/news.tsx` | `GET /posts?sort=latest&limit=50`; client-side type filter. |
| `comments.tsx` | `GET /posts/:id`, `GET /posts/:id/comments?limit=50`, `POST /posts/:id/comments`. |
| `report.tsx` | `POST /reports`; success shows the real report reference and a link to the new incident. |
| `(tabs)/profile.tsx` | `GET /me`, report total from `GET /reports`, post total from `GET /posts?authorUserId=<id>`. |

Notes:

- Likes update optimistically, then use the server's `liked` and `likeCount`; failures roll back the UI and show an alert.
- The comments list is oldest-first and capped at 50 by the API validator.
- Report category labels map to API values: Safety → `safety`, Harassment → `harassment`, Theft → `theft`, Vandalism → `vandalism`, Other → `other`.
- Report locations use static campus coordinates in `report.tsx`. Replace them with a real campus location directory when one exists.
- The photo picker keeps local previews but does not send `mediaRefs`; the API only accepts HTTPS media references after a real upload.
- The incident screen shows the real status, public summary, report count, timeline, and related incidents.
- The map uses the existing static campus image with incident markers positioned from coordinates. It is not a live map SDK yet.

## 6. Not yet wired

- Push-token registration and the notification preferences UI. The backend endpoints exist; the app still shows a local notification placeholder.
- A user-facing notification-history endpoint does not exist.
- Creating posts from the app. `POST /posts` exists, but there is no composer UI yet.
- Photo upload/object storage.
- “I can confirm / add details” (`POST /incidents/:id/updates`).
- Saved posts and settings screens.
- A live map SDK (`react-native-maps` or `expo-maps`).

## 7. Push notifications (Android FCM)

The Android client is wired for **direct FCM**:

- `expo-notifications` obtains the native FCM token with `getDevicePushTokenAsync()`.
- The app registers it at `POST /devices/push-token` with the `alertu-alerts` Android channel.
- The backend sends through Firebase Admin (`PUSH_PROVIDER=fcm`).
- Remote push requires a development build. Expo Go on Android cannot register an FCM token.

See [`ANDROID_PUSH.md`](ANDROID_PUSH.md) for the credential layout, build commands, test command, and troubleshooting.

## 8. Error and offline behavior

- `401 INVALID_TOKEN`: refresh the Firebase token; if it still fails, sign out.
- `401 AUTH_REQUIRED`: send the user to login.
- `403 ACCOUNT_INACTIVE`: show a suspended-account message and sign out.
- `403 CAMPUS_SCOPE_FORBIDDEN`: refresh `/me`; the user is acting on another campus.
- `404 INCIDENT_NOT_FOUND` / `POST_NOT_FOUND`: reload the list; the item may have been removed or expired.
- `409 INCIDENT_NOT_OPEN`: reload the incident.
- `429 RATE_LIMITED`: back off using the `RateLimit-*` response headers.
- Network failures: show the configured API URL in the message so device-host mistakes are obvious.

## 9. Verification

Checks used while wiring the app:

```bash
cd mobile && npx tsc --noEmit
cd mobile && npx expo lint
cd mobile && CI=1 npx expo export --platform web
```

The web build was also exercised in a headless browser against the local API on port 5000:

- Home loaded the live incident and latest gist.
- Map rendered incident markers and the selected incident card.
- Incident detail loaded status, timeline, and report count.
- Pulse loaded real posts, and like/unlike changed `1 → 0 → 1`.
- Comments loaded and a new comment appeared with an updated count.
- The three-step report form created a report, showed a real `AU-XXXXXXXX` reference, and the new incident was fetchable.
- Profile showed the real name, email, role, campus, report/post totals, and member year.

Not verified: iOS/Android simulators, physical devices, real Firebase Auth/FCM, Google Maps geocoding, push delivery, and photo upload.

## 10. Before hosting

1. Set `NODE_ENV=production`.
2. Remove or set `DEV_AUTH_ENABLED=false`; production startup rejects it.
3. Remove `FIREBASE_AUTH_EMULATOR_HOST`.
4. Provide `FIREBASE_PROJECT_ID` and a real service-account credential source.
5. Replace `CORS_ORIGIN=*` with an explicit allow-list.
6. Point `EXPO_PUBLIC_API_URL` at the deployed HTTPS API and remove the development token from the mobile environment.
7. Configure Firebase client keys and the platform app registrations.
8. Add object storage before enabling photo attachments.
