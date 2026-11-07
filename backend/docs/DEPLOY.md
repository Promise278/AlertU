# Deploying the AlertU backend

The backend is a stateless Node.js/Express API. It needs:

- Node.js 22+
- The Aiven PostgreSQL database
- A Firebase service account for Auth and FCM

No local file storage is used, so it can run on any container host.

## Option A — Render (recommended)

`render.yaml` (repository root) and `backend/Dockerfile` are already in place.

1. Commit and push the backend changes and `render.yaml` to GitHub.
2. In Render, choose **New → Blueprint** and select this repository and branch.
3. Render reads `render.yaml` and creates the `alertu-backend` web service.
4. Fill in the two secret environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Copy from `backend/.env`; the path must end in `/defaultdb` |
| `DB_NAME` | `defaultdb` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Base64 of the service account file |

`JWT_SECRET` is generated automatically by Render.

Generate the service account value locally:

```bash
# Firebase service account (single line, no wrapping)
base64 -w0 backend/secrets/firebase-service-account.json
```

Do **not** upload `backend/secrets/firebase-service-account.json` or `backend/.env` to Git.

5. Deploy. The start command runs `npm run db:migrate` before the server starts.
6. Open `https://YOUR-SERVICE.onrender.com/health/live` and confirm it returns `{"status":"ok"}`.

Render injects `PORT`; the service listens on it automatically.

### Free-plan note

Render free web services sleep after inactivity. The first request after a
sleep can take 30–60 seconds. That is acceptable for testing, but use a paid
instance for real users.

## Option B — Railway or another container host

Point the provider at the `backend/Dockerfile`, or use:

- Build: `npm ci --omit=dev`
- Start: `npm run db:migrate && npm start`
- Health check: `/health/live`

Set the same environment variables as above.

## Required environment variables

```dotenv
NODE_ENV=production
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/defaultdb
DB_NAME=defaultdb
JWT_SECRET=<32+ random characters>
FIREBASE_PROJECT_ID=alertu-a7a43
FIREBASE_SERVICE_ACCOUNT_JSON=<base64 service-account JSON>
PUSH_PROVIDER=fcm
PUSH_ENABLED=true
TRUST_PROXY=1
```

Optional:

```dotenv
CORS_ORIGIN=https://your-web-app.example.com   # only for a browser client
DB_SSL=true                                    # already the default
```

When all of `DB_NAME`, `DB_USER`, and `DB_HOST` are set, those discrete values take precedence over `DATABASE_URL`, including the host and port. Keep `DB_NAME=defaultdb` and set `DB_HOST`/`DB_PORT` to the intended Aiven endpoint. If the discrete connection values are incomplete, the backend uses `DATABASE_URL` and normalizes its database path to `DB_NAME` (or `defaultdb`).

`GOOGLE_APPLICATION_CREDENTIALS` also works if the host lets you mount the
service-account file, but `FIREBASE_SERVICE_ACCOUNT_JSON` is easier on Render.

## After deployment

Set the public URL in the mobile app:

```dotenv
EXPO_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com
```

For EAS builds, add the same value to the build profile in `mobile/eas.json`
or as an EAS environment variable. Public Expo variables are embedded at
bundle time, so restart the dev server or rebuild after changing it.

Verify with:

```bash
curl https://YOUR-SERVICE.onrender.com/health/live
curl https://YOUR-SERVICE.onrender.com/
```

Then install the development build, sign in with Google, and the app will
register its FCM token. Test push with:

```bash
cd backend
npm run push:test:latest -- "AlertU test" "FCM delivery works"
```

## Production notes

- `NODE_ENV=production` disables the shared `dev:` auth token.
- Never commit `.env` or `secrets/`.
- `db:migrate` is safe to run repeatedly; it only applies pending migrations.
- The API currently mounts `/health`, `/auth`, `/me`, and `/devices`.
- If you run more than one instance, run migrations once as a release step
  instead of in every container start.
