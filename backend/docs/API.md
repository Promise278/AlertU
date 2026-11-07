# AlertU API Reference

> **Deployment note (2026-11-03):** only `/`, `/health`, `/health/live`, `/auth/*`, `/me`, and `/devices/*` are currently mounted on production. The Reports, Incidents, Moderation, Posts, Notification Preferences, and Maps sections below are **draft contracts** and return `404` until their routers are mounted. For the frontend handoff, use [`FRONTEND_API_GUIDE.md`](FRONTEND_API_GUIDE.md).

Production base URL: `https://alertu.onrender.com`

Local base URL: `http://localhost:5000`

All application responses use JSON. Protected endpoints require a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

The server verifies the token with Firebase Admin, then loads or provisions the matching local user. Roles and campus scope always come from PostgreSQL, never from the client payload.

## Conventions

### Success envelope

```json
{
  "data": {}
}
```

List endpoints add pagination metadata:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasMore": false
  }
}
```

### Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "path": "body.category", "message": "Invalid option" }]
  },
  "requestId": "0f9f4c4e-0e6d-4db2-a1f4-0c8c6be0bd28"
}
```

`X-Request-Id` is accepted from a client and returned on every response. If absent, the server generates one.

### Pagination

| Parameter | Default | Range |
| --- | --- | --- |
| `page` | `1` | >= 1 |
| `limit` | `20` | 1–50 |

### Time values

Use ISO 8601 timestamps with an explicit offset, for example `2026-10-28T09:30:00.000Z`. Incident observations cannot be more than 5 minutes in the future or older than 60 days.

### Coordinates

Latitude range: `-90..90`. Longitude range: `-180..180`.

For unauthenticated requests, incident coordinates are rounded to three decimal places (roughly 100 m). Authenticated users receive exact incident coordinates. Reports are readable only by their owner or a moderator, so report coordinates are always exact for those viewers. Moderators additionally see reporter identity and audit details.

## Authentication and identity

### `GET /me`

Returns the authenticated profile. Creating the first authenticated request provisions a `student` user and assigns the only active campus when exactly one exists.

```bash
curl "$API/me" -H "Authorization: Bearer $TOKEN"
```

```json
{
  "data": {
    "id": "4a8d...",
    "firebaseUid": "firebase-uid",
    "displayName": "Promise",
    "email": "promise@campus.edu",
    "role": "student",
    "campusId": "00000000-0000-4000-8000-000000000001",
    "campus": {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "AlertU Campus",
      "slug": "alertu-campus",
      "timezone": "UTC"
    },
    "accountStatus": "active",
    "lastSeenAt": "2026-10-28T09:30:00.000Z",
    "createdAt": "2026-10-28T09:30:00.000Z",
    "updatedAt": "2026-10-28T09:30:00.000Z"
  }
}
```

Roles: `student`, `moderator`, `admin`. Suspended/deactivated accounts receive `403 ACCOUNT_INACTIVE`.

## Health and metadata

### `GET /health`

Checks the database connection. Returns `200` when the database is reachable, `503` otherwise.

```json
{
  "status": "ok",
  "timestamp": "2026-10-28T09:30:00.000Z",
  "uptimeSeconds": 120,
  "database": { "status": "up", "latencyMs": 42 }
}
```

### `GET /health/live`

Liveness only; does not query the database.

### `GET /`

API metadata, including the documentation path.

## Reports

Reports are raw campus observations. Creating a report atomically creates an incident cluster and links the report to it.

### `POST /reports`

Authentication required. Write rate limit applies.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `campusId` | UUID | No | Defaults to the user's campus. Students cannot report for another campus. |
| `category` | enum | Yes | See categories below. |
| `description` | string | Yes | 5–4000 characters. |
| `observedAt` | ISO timestamp | No | Defaults to now. |
| `locationName` | string | Yes | 2–200 characters. |
| `latitude` | number | Conditional | Must be supplied with `longitude`. |
| `longitude` | number | Conditional | Must be supplied with `latitude`. |
| `address` | string | Conditional | 5–300 characters. Server geocodes when coordinates are absent. Requires Google Maps configuration. |
| `mediaRefs` | string[] | No | Up to 5 HTTPS URLs. |
| `isAnonymous` | boolean | No | Default `true`. Records reporter intent. The API never exposes reporter identity to other students; moderators can always review reports. |

Unknown fields are rejected.

```bash
curl -X POST "$API/reports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "safety",
    "description": "Flooding is blocking the walkway near the library entrance.",
    "locationName": "University Library",
    "latitude": 6.5244,
    "longitude": 3.3792,
    "isAnonymous": true
  }'
```

`201 Created`:

```json
{
  "data": {
    "report": {
      "id": "6bc1...",
      "category": "safety",
      "description": "Flooding is blocking the walkway near the library entrance.",
      "observedAt": "2026-10-28T09:30:00.000Z",
      "submittedAt": "2026-10-28T09:30:02.000Z",
      "locationName": "University Library",
      "latitude": 6.5244,
      "longitude": 3.3792,
      "mediaRefs": [],
      "isAnonymous": true,
      "campusId": "00000000-0000-4000-8000-000000000001",
      "reporterUserId": "4a8d..."
    },
    "incidentId": "0dc2..."
  }
}
```

If an address is supplied without coordinates, the server calls Google Geocoding. Missing configuration returns `503 MAPS_NOT_CONFIGURED`; no report is written.

### `GET /reports`

Authentication required. Returns the caller's reports, newest first. Supports `page` and `limit`.

### `GET /reports/:id`

Authentication required. The report owner or a moderator/admin may read it. The response also includes active incident links:

```json
{
  "data": {
    "id": "6bc1...",
    "incidents": [
      { "id": "0dc2...", "title": "Safety reported near University Library", "status": "reported", "linkedAt": "..." }
    ]
  }
}
```

Other students receive `403 REPORT_FORBIDDEN`.

## Incidents

Incidents are moderator-facing clusters of reports. The public feed exposes safe summaries, status, location, freshness, and report counts.

### `GET /incidents`

Optional authentication. Query parameters:

| Parameter | Type | Notes |
| --- | --- | --- |
| `page`, `limit` | integer | Pagination. |
| `status` | enum | If omitted, active statuses are returned. Non-public statuses require a moderator. |
| `category` | enum | Filter by category. |
| `campusId` | UUID | Defaults to the authenticated user's campus. Anonymous callers can omit it for a cross-campus public feed. |
| `q` | string | Case-insensitive title/summary/location search, 2–100 characters. |
| `from`, `to` | ISO timestamp | Filter by `lastSeenAt`. `from` must not be after `to`. |
| `bbox` | string | `minLng,minLat,maxLng,maxLat`. |
| `includeResolved` | boolean | Include `resolved` and `expired` when no explicit `status` is supplied. |

```bash
curl "$API/incidents?category=safety&bbox=3.3,6.5,3.5,6.7&limit=10"
```

Each item contains `status`, `statusLabel`, `publicSummary`, `firstSeenAt`, `lastSeenAt`, `expiresAt`, `latitude`, `longitude`, `affectedRadiusMeters`, `reportCount`, and a `freshness` object:

```json
{
  "freshness": {
    "isStale": false,
    "expiresAt": "2026-10-29T09:30:00.000Z",
    "ageMinutes": 12,
    "expiresInMinutes": 1430
  }
}
```

### `GET /incidents/:id`

Optional authentication. Public statuses are readable by anyone; `rejected` incidents return `404` unless the caller is a moderator.

The response adds a chronological `timeline`. Moderators also receive `reports`, including reporter identity for review. Reporters are never included in a student-facing response.

### `POST /incidents/:id/updates`

Authentication required. Adds an observation to an open incident.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `description` | string | Yes | 3–2000 characters. |
| `observedAt` | ISO timestamp | No | Defaults to now. |
| `locationName` | string | No | Defaults to the incident location. |
| `latitude`, `longitude` | number | No | Must be supplied together. |
| `mediaRefs` | string[] | No | Up to 5 HTTPS URLs. |
| `isAnonymous` | boolean | No | Default `true`. |

The incident must be active. Students may only update incidents on their own campus. Closed incidents return `409 INCIDENT_NOT_OPEN`.

```json
{
  "data": {
    "update": { "id": "...", "description": "The water level is still rising.", "observedAt": "...", "isAnonymous": true },
    "incident": { "id": "...", "lastSeenAt": "...", "expiresAt": "..." }
  }
}
```

## Moderation

All moderation endpoints require `moderator` or `admin`. Every decision writes a `moderation_actions` row with actor, reason, evidence note, before/after status, and metadata.

### `GET /moderation/queue`

Query: `status`, `campusId`, `page`, `limit`. Without `status`, returns the review queue: `reported`, `candidate`, `corroborated`, `under_review`, `disputed`, `reopened`. Ordered oldest activity first.

### `GET /moderation/reports`

Query: `campusId`, `q`, `page`, `limit`. Moderator view of raw reports with reporter identity.

### `POST /moderation/incidents/:id/decision`

```json
{
  "status": "verified",
  "reasonCode": "evidence_sufficient",
  "evidenceNote": "Campus security and facilities independently confirmed the flooding.",
  "publicSummary": "Campus security confirmed flooding near the library walkway.",
  "expiresAt": "2026-10-29T12:00:00.000Z"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `status` | Yes | Must be an allowed transition from the current status. |
| `reasonCode` | Yes | See reason codes below. |
| `evidenceNote` | Conditional | Required (>= 10 characters) for `verified`, `disputed`, and `rejected`. |
| `publicSummary` | No | 10–1000 characters. |
| `expiresAt` | No | ISO timestamp. |

`verified` requires at least one active source report. Invalid transitions and unchanged statuses return `409`.

Response:

```json
{
  "data": {
    "incident": { "id": "...", "status": "verified", "statusLabel": "Verified" },
    "action": {
      "id": "...",
      "action": "decision",
      "reasonCode": "evidence_sufficient",
      "beforeStatus": "under_review",
      "afterStatus": "verified",
      "actor": { "id": "...", "displayName": "Moderator", "role": "moderator" },
      "evidenceNote": "Campus security and facilities independently confirmed the flooding.",
      "metadata": {}
    }
  }
}
```

### `POST /moderation/clusters/:id/merge`

Merges one or more source incidents into the target cluster.

```json
{
  "sourceIncidentIds": ["source-uuid-1", "source-uuid-2"],
  "reasonCode": "duplicate",
  "rationale": "All reports describe the same walkway obstruction.",
  "title": "Flooding near the library walkway",
  "publicSummary": "Multiple reports describe the same flooding location."
}
```

Rules:

- The target must be active; sources must be active and on the same campus.
- The target cannot be listed as a source.
- Active report links move to the target. Old links remain as inactive history.
- Sources become `rejected` with an explanatory public summary and a `merge_source` audit row.
- The target gets a `merge_target` audit row and recomputed `reportCount`, `firstSeenAt`, `lastSeenAt`, `expiresAt`.
- Response: `{ data: { incident, sourceIncidentIds, mergedReportCount } }`.

### `POST /moderation/clusters/:id/split`

Moves selected active reports from an incident into a new incident.

```json
{
  "reportIds": ["report-uuid-1"],
  "reasonCode": "split",
  "rationale": "Moderator review found this report describes a different event.",
  "title": "Separate event near the cafeteria",
  "category": "theft",
  "publicSummary": "A separate report is under independent review.",
  "locationName": "Cafeteria",
  "latitude": 6.6,
  "longitude": 3.4,
  "affectedRadiusMeters": 120
}
```

Rules:

- Every report must be actively linked to the source incident.
- The new incident starts as `reported`.
- Source report count is recomputed. If none remain, the source becomes `rejected`.
- Both sides receive audit rows (`split_source`, `split_target`).
- Response: `{ data: { sourceIncident, incident } }` with `201 Created`.

## Posts, likes, and comments

Posts cover Campus Pulse content and News & Gist content:

| `type` | Typical usage |
| --- | --- |
| `gist` | Short campus conversation; title optional. |
| `news` | School news; title required. |
| `event` | Campus event; title required. |

Only `published` posts appear in list results. A `hidden`/`removed` post is still fetchable through `GET /posts/:id` by its author or a moderator.

### `GET /posts`

Optional authentication.

Query: `page`, `limit`, `type` (`gist`, `news`, `event`), `campusId`, `authorUserId`, `q` (2–100 chars), `sort` (`latest` default or `popular`).

When authenticated and `campusId` is omitted, the result is scoped to the caller's campus. Anonymous requests have no campus scope.

Post shape:

```json
{
  "id": "...",
  "campusId": "...",
  "type": "gist",
  "title": null,
  "body": "Does anyone know if the library is open today?",
  "mediaRefs": [],
  "tags": ["library"],
  "isPinned": false,
  "likeCount": 3,
  "commentCount": 1,
  "liked": true,
  "isOwner": false,
  "author": { "id": "...", "displayName": "Promise", "role": "student" },
  "createdAt": "...",
  "updatedAt": "..."
}
```

`status` is only present for the author and moderators.

### `POST /posts`

Authentication required. Write rate limit applies.

| Field | Required | Notes |
| --- | --- | --- |
| `campusId` | No | Defaults to the author's campus. Students cannot post to another campus. |
| `type` | No | `gist` (default), `news`, or `event`. |
| `title` | Conditional | Required for `news` and `event`; 3–160 characters. |
| `body` | Yes | 1–5000 characters. |
| `mediaRefs` | No | Up to 5 HTTPS URLs. |
| `tags` | No | Up to 10 unique tags, 1–30 characters each. |

### `GET /posts/:id`

Optional authentication. Returns one post. A removed/hidden post is `404` unless the caller is the author or a moderator.

### `DELETE /posts/:id`

Author or moderator/admin. Soft-deletes by setting `status = removed`. Returns `204 No Content`.

### `POST /posts/:id/like`

Authentication required. Idempotent: liking twice does not increment the count twice.

```json
{ "data": { "liked": true, "likeCount": 4, "postId": "..." } }
```

### `DELETE /posts/:id/like`

Authentication required. Idempotent. Removes the like if present and decrements the count at most once.

### `GET /posts/:id/comments`

Optional authentication. Visible comments are public. Moderators see hidden comments as well. Supports `page` and `limit`, oldest first.

```json
{
  "id": "...",
  "postId": "...",
  "body": "I think it closes at 10pm.",
  "author": { "id": "...", "displayName": "Promise", "role": "student" },
  "isOwner": false,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `POST /posts/:id/comments`

Authentication required. Body: `{ "body": "..." }`, 1–1000 characters. Returns `201` with `{ data: { comment, commentCount } }`.

### `DELETE /posts/:id/comments/:commentId`

Comment author or moderator/admin. Hides the comment and decrements the visible count once. Returns `204 No Content`.

Likes and comments queue notifications for the post author when the actor is someone else. Self-actions do not queue events.

## Devices and push notifications

### `GET /devices`

Authentication required. Returns the caller's active push devices.

### `POST /devices/push-token`

Authentication required. Registers or refreshes a device token.

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android",
  "appVersion": "1.0.0"
}
```

- `platform`: `android`, `ios`, or `web`.
- `token`: 20–4096 characters.
- Returns `201` on first registration, `200` on refresh.
- A token that moves to a different account is reassigned to the authenticated caller.

### `DELETE /devices/push-token`

Authentication required. Body: `{ "token": "..." }`. Deactivates the caller's token. Always returns `204`.

### `GET /notification-preferences`

Returns the caller's preferences. If no row exists, returns defaults with `isDefault: true`.

```json
{
  "data": {
    "id": null,
    "userId": "...",
    "enabled": true,
    "categories": [],
    "isDefault": true
  }
}
```

An empty `categories` array means all categories.

### `PUT /notification-preferences`

Body must contain `enabled` and/or `categories`:

```json
{
  "enabled": true,
  "categories": ["safety", "fire"]
}
```

Categories must be unique and valid. Returns the updated preferences.

### `GET /notifications`

Authentication required. Returns the caller's in-app notification events, newest first. Supports `page` and `limit` query parameters.

```json
{
  "data": [
    {
      "id": "...",
      "type": "incident_status_changed",
      "title": "Incident update",
      "message": "An incident near you was verified.",
      "data": {
        "incidentId": "..."
      },
      "state": "sent",
      "createdAt": "2026-11-07T10:00:00.000Z",
      "sentAt": "2026-11-07T10:00:02.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

Read state is currently managed by the client; the backend feed is append-only.

## Google Maps

These endpoints use the **server-side** key. They require authentication and the maps rate limit. The mobile app should call these endpoints instead of shipping a server key.

### `GET /maps/status`

```json
{ "data": { "configured": true } }
```

### `POST /maps/geocode`

```json
{ "address": "University of Lagos, Akoka" }
```

Returns up to five matches:

```json
{
  "data": {
    "results": [
      {
        "formattedAddress": "University of Lagos, Akoka, Lagos, Nigeria",
        "latitude": 6.5158,
        "longitude": 3.3898,
        "placeId": "...",
        "locationType": "APPROXIMATE",
        "types": ["university"]
      }
    ]
  }
}
```

Errors: `422 MAPS_NO_RESULTS`, `503 MAPS_NOT_CONFIGURED`, `503 MAPS_UNAVAILABLE`, `503 MAPS_BAD_RESPONSE`.

### `POST /maps/reverse-geocode`

```json
{ "latitude": 6.5158, "longitude": 3.3898 }
```

Returns up to three formatted address matches.

## Enumerations

### Categories

`safety`, `harassment`, `theft`, `vandalism`, `infrastructure`, `medical`, `fire`, `other`

Default freshness windows (hours):

| Category | Hours |
| --- | --- |
| safety | 24 |
| harassment | 72 |
| theft | 72 |
| vandalism | 168 |
| infrastructure | 168 |
| medical | 24 |
| fire | 24 |
| other | 72 |

`INCIDENT_DEFAULT_TTL_HOURS` is the fallback. Expiry is applied by `npm run incidents:expire`.

### Incident statuses

| Status | Label | Active | Public | Push |
| --- | --- | --- | --- | --- |
| `reported` | Reported | Yes | Yes | No |
| `candidate` | Candidate | Yes | Yes | No |
| `corroborated` | Corroborated | Yes | Yes | Yes |
| `under_review` | Under review | Yes | Yes | Yes |
| `verified` | Verified | Yes | Yes | Yes |
| `disputed` | Disputed | Yes | Yes | Yes |
| `rejected` | Rejected | No | No | Yes |
| `resolved` | Resolved | No | Yes | Yes |
| `expired` | Expired | No | Yes | Yes |
| `reopened` | Reopened | Yes | Yes | Yes |

Allowed transitions:

| From | To |
| --- | --- |
| `reported` | `candidate`, `corroborated`, `under_review`, `verified`, `disputed`, `rejected`, `resolved`, `expired` |
| `candidate` | `corroborated`, `under_review`, `verified`, `disputed`, `rejected`, `resolved`, `expired` |
| `corroborated` | `under_review`, `verified`, `disputed`, `rejected`, `resolved`, `expired` |
| `under_review` | `verified`, `disputed`, `rejected`, `resolved`, `expired` |
| `verified` | `disputed`, `rejected`, `resolved`, `expired`, `reopened` |
| `disputed` | `under_review`, `verified`, `rejected`, `resolved`, `reopened` |
| `rejected` | `reopened` |
| `resolved` | `reopened`, `expired` |
| `expired` | `reopened` |
| `reopened` | `candidate`, `corroborated`, `under_review`, `verified`, `disputed`, `rejected`, `resolved`, `expired` |

### Moderation reason codes

`evidence_sufficient`, `evidence_insufficient`, `duplicate`, `false_report`, `condition_cleared`, `condition_expired`, `new_evidence`, `policy_violation`, `merged`, `split`, `other`

## Rate limits

Rate limits are per client IP and return `429 RATE_LIMITED` with draft-8 `RateLimit-*` headers when a bucket resets. Health checks are exempt from the global limiter.

| Bucket | Window | Default max | Applies to |
| --- | --- | --- | --- |
| Global | 15 min | 300 | All non-health routes |
| Write | 15 min | 60 | Report/post/comment/device writes, incident observations, and likes/unlikes |
| Moderation | 15 min | 60 | All `/moderation/*` routes |
| Maps | 15 min | 30 | All `/maps/*` routes |

If the API runs behind a reverse proxy, set `TRUST_PROXY` correctly so limits apply per real client instead of per proxy.

## Common error codes

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Body/query/params failed Zod validation, or database validation failed. |
| 400 | `INVALID_JSON` | Malformed JSON body. |
| 401 | `AUTH_REQUIRED` | Missing bearer token. |
| 401 | `INVALID_TOKEN` | Firebase token invalid/expired or identity could not be resolved. |
| 403 | `FORBIDDEN` | Role or ownership check failed. |
| 403 | `ACCOUNT_INACTIVE` | User is suspended/deactivated. |
| 403 | `CAMPUS_SCOPE_FORBIDDEN` | Student attempted to act on another campus. |
| 404 | `*_NOT_FOUND` | Resource not found or intentionally hidden. |
| 409 | `CONFLICT` | Unique value conflict. |
| 409 | `INVALID_STATUS_TRANSITION` | Moderator transition is not allowed. |
| 409 | `INCIDENT_NOT_OPEN` | Observation attempted on a closed incident. |
| 413 | `PAYLOAD_TOO_LARGE` | JSON body exceeds `JSON_BODY_LIMIT`. |
| 429 | `RATE_LIMITED` | Rate limit exceeded. |
| 503 | `AUTH_NOT_CONFIGURED` | Firebase Admin credentials are missing. |
| 503 | `PUSH_NOT_CONFIGURED` | Push delivery selected but Firebase is not configured. |
| 503 | `MAPS_NOT_CONFIGURED` | Server maps key missing. |
| 503 | `MAPS_UNAVAILABLE` | Google Maps request failed. |
| 503 | `DATABASE_ERROR` / degraded health | Database unavailable. |
