# AlertU API — Frontend Integration Guide

Last verified: **2026-11-07**

| Environment | Base URL |
| --- | --- |
| Production (Render) | `https://alertu.onrender.com` |
| Local backend | `http://localhost:5000` |

> **Read this first:** the Firebase-authenticated endpoints in sections 3 and 6 are mounted in `backend/index.js`. The hosted production backend must be redeployed before newly added routes are available there. Section 4 describes legacy email/password + JWT routes; do not use them from the AlertU web or mobile apps.

---

## 1. Authentication

AlertU uses **Firebase Authentication with Google Sign-In**. The backend never accepts a password, role, campus, or user ID from the client.

### Flow

1. Sign in with Google in the app.
2. Exchange the Google credential for a Firebase session.
3. Get the Firebase ID token.
4. Send it on every protected request:

```http
Authorization: Bearer <firebase-id-token>
```

5. Call `GET /me` once after sign-in. The backend verifies the token, creates the local user on first use, and returns the profile.

### Mobile (React Native / Expo)

```ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';

GoogleSignin.configure({
  webClientId:
    '469158474213-qqmt3gvmeb6g3r0v4pm3c2ia0mvm0ulj.apps.googleusercontent.com',
});

const response = await GoogleSignin.signIn();
if (response.type !== 'success' || !response.data.idToken) {
  throw new Error('Google did not return an ID token');
}

await signInWithCredential(
  firebaseAuth,
  GoogleAuthProvider.credential(response.data.idToken)
);

const idToken = await firebaseAuth.currentUser?.getIdToken();
```

### Web

```ts
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseAuth } from './firebase';

await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
const idToken = await firebaseAuth.currentUser?.getIdToken();
```

### Calling the API

```ts
const API_URL = 'https://alertu.onrender.com';
const token = await firebaseAuth.currentUser?.getIdToken();

const response = await fetch(`${API_URL}/me`, {
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  },
});

const payload = await response.json();
if (!response.ok) {
  throw new Error(payload.error?.message ?? `HTTP ${response.status}`);
}
```

Firebase ID tokens expire after about one hour. Call `getIdToken()` before a request, or `getIdToken(true)` to force a refresh.

---

## 2. Common conventions

### Success responses

Single resource:

```json
{
  "data": {}
}
```

List:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 0,
    "totalPages": 0,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

The root endpoint and the legacy `/auth/*` endpoints use a different `{ "success": ... }` envelope. They are documented separately below.

### Error responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "path": "body.platform",
        "message": "Invalid option",
        "code": "invalid_enum_value"
      }
    ]
  },
  "requestId": "0f9f4c4e-0e6d-4db2-a1f4-0c8c6be0bd28"
}
```

- `details` is optional.
- `requestId` is always returned for the newer endpoints. Include it when reporting a backend bug.
- Clients may send `X-Request-Id` (max 128 characters). The server returns the same value.

### Identifiers and time

- IDs are UUIDs.
- Timestamps are ISO 8601 UTC strings, for example `2026-11-03T20:45:10.272Z`.
- Send `Content-Type: application/json` when there is a body.

### Rate limits

| Scope | Limit |
| --- | --- |
| All requests per IP | 300 / 15 minutes |
| Legacy `/auth/*` | 10 / 15 minutes |
| Device writes (`POST`/`DELETE /devices/push-token`) | 60 / 15 minutes |

The global limiter and the legacy auth limiter return:

```json
{ "success": false, "message": "Too many requests. Please try again later." }
```

The device write limiter returns `429` with:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many write requests. Please slow down."
  },
  "requestId": "..."
}
```

Rate-limit headers are included on responses.

---

## 3. LIVE endpoints

### `GET /`

Public. Basic API metadata.

```json
{
  "success": true,
  "message": "Welcome to AlertU API"
}
```

---

### `GET /health`

Public. Checks the PostgreSQL connection.

`200 OK`:

```json
{
  "status": "ok",
  "timestamp": "2026-11-03T20:45:10.272Z",
  "uptimeSeconds": 113,
  "database": {
    "status": "up",
    "latencyMs": 135
  }
}
```

`503 Service Unavailable` when the database is down:

```json
{
  "status": "degraded",
  "timestamp": "2026-11-03T20:45:10.272Z",
  "uptimeSeconds": 113,
  "database": {
    "status": "down"
  }
}
```

---

### `GET /health/live`

Public. Confirms the process is alive. Does not touch the database.

```json
{
  "status": "ok",
  "timestamp": "2026-11-03T20:45:10.272Z"
}
```

---

### `GET /me/exists`

**Auth:** Firebase ID token required.

Checks whether the signed-in Firebase user already has an AlertU account **without creating one**. Call this before allowing a Google or email/password sign-in.

`200 OK` when the account exists:

```json
{
  "data": {
    "exists": true,
    "user": {
      "id": "aacee96a-2246-4bc7-a65c-a692363b8962",
      "name": "Promise",
      "email": "promise@campus.edu",
      "role": "student",
      "campusId": "00000000-0000-4000-8000-000000000001",
      "accountStatus": "active",
      "campus": {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "AlertU Campus"
      }
    }
  }
}
```

`200 OK` when the account does not exist:

```json
{
  "data": {
    "exists": false
  }
}
```

Notes:

- This endpoint never creates a user.
- A verified Firebase email is matched to an existing AlertU account by email and linked to the Firebase UID.
- When `exists` is `false`, clients should sign the Firebase user out and ask them to register.

---

### `GET /me`

**Auth:** Firebase ID token required.

Returns the current user's profile. On the first authenticated call, the backend creates a `student` account and assigns the only active campus, if exactly one exists. Use `GET /me/exists` first when you only need to know whether the account is already registered.

`200 OK`:

```json
{
  "data": {
    "id": "aacee96a-2246-4bc7-a65c-a692363b8962",
    "name": "Promise",
    "email": "promise@campus.edu",
    "role": "student",
    "campusId": "00000000-0000-4000-8000-000000000001",
    "accountStatus": "active",
    "campus": {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "AlertU Campus"
    }
  }
}
```

Notes:

- `role` is lowercase: `student`, `moderator`, or `admin`.
- `campus` and `campusId` may be `null`.
- `accountStatus` can be `active`, `suspended`, or `deactivated`. Non-active accounts receive `403 ACCOUNT_INACTIVE`.
- The response uses `name`, not `displayName`.

---

### `GET /devices`

**Auth:** Firebase ID token required.

Returns the current user's **active** push devices. It does not return the raw FCM token.

`200 OK`:

```json
{
  "data": [
    {
      "id": "0d4f1e8a-9b2c-4a1d-8f3e-123456789abc",
      "platform": "android",
      "appVersion": "1.0.0",
      "active": true,
      "lastSeenAt": "2026-11-03T20:50:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

This endpoint has no pagination query parameters; it always returns up to 50 active devices.

---

### `POST /devices/push-token`

**Auth:** Firebase ID token required.

Registers or refreshes an FCM device token. Call this after Google sign-in and after notification permission is granted.

Request:

```json
{
  "token": "fM...:APA91b...",
  "platform": "android",
  "appVersion": "1.0.0"
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `token` | string | Yes | 20–4096 characters. Use the FCM token from `getDevicePushTokenAsync()`, **not** an Expo push token. |
| `platform` | enum | Yes | `android`, `ios`, or `web`. |
| `appVersion` | string or null | No | Max 32 characters. |

Responses:

- `201 Created` — token registered for the first time.
- `200 OK` — existing token refreshed.

```json
{
  "data": {
    "id": "0d4f1e8a-9b2c-4a1d-8f3e-123456789abc",
    "platform": "android",
    "active": true,
    "appVersion": "1.0.0",
    "lastSeenAt": "2026-11-03T20:50:00.000Z"
  }
}
```

A token that was previously linked to another account is reassigned to the authenticated caller. This is intentional so a shared device receives notifications for the current account.

---

### `DELETE /devices/push-token`

**Auth:** Firebase ID token required.

Deactivates the caller's token. Call this on sign-out if you want to stop notifications on that device.

Request:

```json
{
  "token": "fM...:APA91b..."
}
```

Response: `204 No Content` with no body. The endpoint also returns `204` when the token is not found, so it is safe to call repeatedly.

---

## 4. Legacy authentication endpoints

These endpoints are mounted and functional, but they use **email/password + JWT**, not Firebase. Do **not** use them in the AlertU mobile app. Their responses use the old `{ "success": ... }` shape.

### `POST /auth/register`

```json
{
  "username": "promise",
  "email": "promise@campus.edu",
  "password": "secret123",
  "role": "sharer"
}
```

- `username`: at least 4 characters.
- `password`: at least 5 characters.
- `role`: `sharer` or `supporter`.
- `201 Created`:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "promise",
    "email": "promise@campus.edu",
    "role": "sharer"
  },
  "message": "User Registered successfully"
}
```

### `POST /auth/login`

```json
{
  "email": "promise@campus.edu",
  "password": "secret123"
}
```

`200 OK`:

```json
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "username": "promise",
    "email": "promise@campus.edu",
    "roles": "sharer",
    "time": 1793739000000
  },
  "message": "User Login successfully"
}
```

The JWT expires after 8 hours. It is **not** a Firebase token and will not work on `/me` or `/devices`.

### `GET /auth/seesupporters`

Requires the legacy JWT:

```http
Authorization: Bearer <jwt>
```

Returns:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "supporter-name",
      "email": "supporter@campus.edu"
    }
  ],
  "message": "Supporters retrieved successfully"
}
```

---

## 5. Route inventory

### Mounted in code

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | Public | API metadata |
| `GET` | `/health` | Public | Database health |
| `GET` | `/health/live` | Public | Process liveness |
| `POST` | `/auth/register` | Public | Legacy email/password registration |
| `POST` | `/auth/login` | Public | Legacy email/password login |
| `GET` | `/auth/seesupporters` | Legacy JWT | Legacy supporter list |
| `GET` | `/me` | Firebase | Current profile (creates on first call) |
| `GET` | `/me/exists` | Firebase | Check registration without creating |
| `GET` | `/devices` | Firebase | List active devices |
| `POST` | `/devices/push-token` | Firebase | Register/refresh FCM token |
| `DELETE` | `/devices/push-token` | Firebase | Deactivate FCM token |
| `GET` | `/incidents` | Public / optional Firebase | List incidents |
| `GET` | `/incidents/:id` | Public / optional Firebase | Incident detail |
| `POST` | `/incidents/:id/updates` | Firebase | Add observation |
| `POST` | `/reports` | Firebase | Create report |
| `GET` | `/reports` | Firebase | List own reports |
| `GET` | `/reports/:id` | Firebase | Report detail |
| `GET` | `/posts` | Public / optional Firebase | List posts |
| `POST` | `/posts` | Firebase | Create post |
| `GET` | `/posts/:id` | Public / optional Firebase | Post detail |
| `DELETE` | `/posts/:id` | Firebase | Delete own post |
| `POST` | `/posts/:id/like` | Firebase | Like post |
| `DELETE` | `/posts/:id/like` | Firebase | Unlike post |
| `GET` | `/posts/:id/comments` | Public / optional Firebase | List comments |
| `POST` | `/posts/:id/comments` | Firebase | Add comment |
| `DELETE` | `/posts/:id/comments/:commentId` | Firebase | Delete own comment |
| `GET` | `/notification-preferences` | Firebase | Get preferences |
| `PUT` | `/notification-preferences` | Firebase | Update preferences |
| `GET` | `/notifications` | Firebase | List in-app notification events |
| `GET` | `/maps/status` | Firebase | Maps provider status |
| `POST` | `/maps/geocode` | Firebase | Geocode address |
| `POST` | `/maps/reverse-geocode` | Firebase | Reverse geocode |
| `GET` | `/moderation/queue` | Firebase moderator | Moderation queue |
| `GET` | `/moderation/reports` | Firebase moderator | Moderation reports |
| `POST` | `/moderation/incidents/:id/decision` | Firebase moderator | Incident decision |
| `POST` | `/moderation/clusters/:id/merge` | Firebase moderator | Merge cluster |
| `POST` | `/moderation/clusters/:id/split` | Firebase moderator | Split cluster |

---

## 6. Mounted live-data endpoints

These routes are wired into `backend/index.js` and use the standard `{ "data": ... }` / `{ "error": ... }` envelopes. Protected routes require the Firebase bearer token described in section 1.

- Incident reads use optional Firebase auth so public incident data can be read without a token.
- Report creation requires an active Firebase user; report reads are scoped to the caller unless the caller is a moderator.
- Post reads use optional Firebase auth; writes, likes, and comments require a Firebase user.
- Notification preferences and the in-app notification feed are scoped to the authenticated user.
- Map and moderation routes require Firebase auth; moderation routes also require a moderator role.

The full request/response contract is documented in:

- `backend/docs/API.md`
- `backend/docs/openapi.yaml`
- `backend/docs/openapi.live.yaml`

Production must be redeployed from the current backend revision before these routes are available at `https://alertu.onrender.com`.

---

## 7. Error codes

| HTTP | Code | Meaning |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR` | Invalid body/query/params |
| `400` | `INVALID_JSON` | Malformed JSON body |
| `401` | `AUTH_REQUIRED` | No bearer token |
| `401` | `INVALID_TOKEN` | Invalid or expired Firebase token |
| `403` | `ACCOUNT_INACTIVE` | Account suspended/deactivated |
| `403` | `FORBIDDEN` | Role or ownership check failed |
| `404` | `ROUTE_NOT_FOUND` | Endpoint is not mounted |
| `409` | `CONFLICT` | Unique value conflict |
| `413` | `PAYLOAD_TOO_LARGE` | Body exceeds the 1 MB default limit |
| `429` | `RATE_LIMITED` | Rate limit exceeded |
| `500` | `INTERNAL_ERROR` | Unexpected server error |
| `500` | `DATABASE_ERROR` | Database failure |
| `503` | `AUTH_NOT_CONFIGURED` | Firebase Admin credentials missing (fixed on production) |

---

## 8. CORS for web frontends

Native mobile apps are **not** affected by CORS.

If the frontend is a browser app on a different origin, the production server currently has no `CORS_ORIGIN` set, so browser requests will be blocked. Set this in the Render dashboard:

```text
CORS_ORIGIN=https://your-frontend.example.com
```

Multiple origins can be comma-separated:

```text
CORS_ORIGIN=https://app.example.com,https://admin.example.com
```

Then redeploy the backend. Do not use `*` for a credentialed production frontend.

---

## 9. Push notifications

The app uses **direct FCM**, not Expo push tokens.

```ts
import * as Notifications from 'expo-notifications';

const permission = await Notifications.requestPermissionsAsync();
if (permission.status !== 'granted') return;

const devicePushToken = await Notifications.getDevicePushTokenAsync();
const fcmToken = String(devicePushToken.data);

await fetch('https://alertu.onrender.com/devices/push-token', {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await firebaseAuth.currentUser?.getIdToken()}`,
  },
  body: JSON.stringify({
    token: fcmToken,
    platform: 'android',
    appVersion: '1.0.0',
  }),
});
```

Important:

- Remote push requires a **development build or standalone build**, not Expo Go.
- Register after sign-in, not before.
- Re-register when the FCM token refreshes, using `Notifications.addPushTokenListener`.
- A real device with Google Play Services is required for Android FCM.
- Automatic notification triggers are **not wired into any mounted production route yet**. Manual delivery uses the backend script:

```bash
cd backend
npm run push:test:latest -- "AlertU test" "FCM delivery works"
```

---

## 10. Frontend testing checklist

```bash
# 1. API is up
curl https://alertu.onrender.com/health

# 2. Protected route rejects anonymous calls
curl -i https://alertu.onrender.com/me
# expect 401 AUTH_REQUIRED

# 3. Authenticated profile works
curl https://alertu.onrender.com/me \
  -H "Authorization: Bearer <firebase-id-token>"

# 4. Device list works
curl https://alertu.onrender.com/devices \
  -H "Authorization: Bearer <firebase-id-token>"
```

Expected live results:

- `/health` → `200` with `database.status: "up"`.
- `/me` without a token → `401 AUTH_REQUIRED`.
- `/me` with a valid Firebase ID token → `200`.
- `/devices` with a valid Firebase ID token → `200`.
- `/devices/push-token` with a real FCM token → `201` or `200`.

---

## 11. Mobile app connection (current)

The Expo app is already pointed at the hosted backend:

- `mobile/.env.local` (gitignored):

```text
EXPO_PUBLIC_API_URL=https://alertu.onrender.com
```

- `mobile/eas.json` — `development`, `preview`, and `production` profiles all set:

```text
EXPO_PUBLIC_API_URL=https://alertu.onrender.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=469158474213-qqmt3gvmeb6g3r0v4pm3c2ia0mvm0ulj.apps.googleusercontent.com
```

- `mobile/src/lib/api.ts` — release builds fall back to `https://alertu.onrender.com` if `EXPO_PUBLIC_API_URL` is not set.

Live verification with a real Firebase ID token:

- `GET /me` → `200`
- `GET /devices` → `200`
- `POST /devices/push-token` → `201`
- `DELETE /devices/push-token` → `204`

The remaining push test needs a real FCM token from an installed Android build.

---

## 12. Production status

- Backend commit deployed from `main`: `9399185`.
- Render service: Node runtime, `https://alertu.onrender.com`.
- PostgreSQL: connected, health check `200`. Local/runtime database is `defaultdb`; keep `DB_NAME=defaultdb` on Render so the URL path cannot select another database.
- Firebase Admin: configured and verified with a real Firebase ID token.
- Live verification: `/me` → `200`, `/devices` → `200`, `/devices/push-token` register → `201`, list → `200`, delete → `204`.
- Current backend revision mounts incident, report, post, notification, map, and moderation routes. Local smoke check: `/health` → `200`, `/incidents` → `200`, `/posts` → `200`, protected routes → `401` without a token.
- Production still runs the older deployed revision; redeploy before using the newly mounted routes at `https://alertu.onrender.com`.
- Push delivery still needs a real Android FCM token from an installed build.
