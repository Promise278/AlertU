<div align="center">

# AlertU

**Campus intelligence, not campus rumors.**

Structured student reports · AI-assisted organization · Visible human verification

[![Status](https://img.shields.io/badge/status-early%20development-orange?style=flat-square)](#project-status)
[![Mobile](https://img.shields.io/badge/mobile-Expo%20SDK%2057-000020?style=flat-square&logo=expo&logoColor=white)](#tech-stack)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=flat-square&logo=react&logoColor=white)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](#tech-stack)
[![Node.js](https://img.shields.io/badge/Node.js-20.19%2B-339933?style=flat-square&logo=node.js&logoColor=white)](#prerequisites)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS%20planned-4169E1?style=flat-square&logo=postgresql&logoColor=white)](#tech-stack)

</div>

---

AlertU is a campus intelligence platform that helps students understand changing conditions through structured community reports, AI-assisted organization, timely updates, and visible human verification.

Campus life changes faster than official notices. Walkways flood, paths close, and safety concerns emerge while reports scatter across group chats, lose their timestamps, and spread without context. AlertU brings those observations into one evolving, accountable picture of campus conditions.

> **The product promise:** One report is a signal. Several similar reports may point to one candidate incident. Human review and visible evidence determine what the platform can responsibly claim.

## Contents

- [Why AlertU](#why-alertu)
- [Product principles](#product-principles)
- [Product experience](#product-experience)
- [Campus Pulse](#campus-pulse)
- [Incident lifecycle](#incident-lifecycle)
- [AI and trust boundaries](#ai-and-trust-boundaries)
- [Routing, privacy, and safety](#routing-privacy-and-safety)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Project status](#project-status)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Roadmap](#roadmap)
- [Quality gates](#quality-gates)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Why AlertU

Campus communities already generate useful signals. The problem is not a lack of reports; it is the lack of a trustworthy way to organize them.

| The problem | The AlertU response |
| --- | --- |
| Reports live in separate chats and lose their timestamps. | Structured, location-aware reports with observation times and optional evidence. |
| Duplicates create noise and inflate apparent confidence. | AI-assisted duplicate suggestions and clustering, always reviewed by a human. |
| Students cannot tell what is verified, disputed, stale, or still unconfirmed. | Visible status, freshness, report count, and verification notes on every incident. |
| Moderators cannot trace where a claim came from or why a decision was made. | Report provenance, merge/split history, reason codes, and an audit trail. |
| Route advice is often guessed rather than computed. | Alternatives only from a real routing source, with a clear no-route fallback. |

AlertU is built for three primary roles, plus an optional response partner:

- **Students and campus members** who need to understand conditions, report what they observe, and decide what to do next.
- **Moderators and verifiers** who review evidence, merge or split reports, correct statuses, and handle abuse.
- **Campus administrators** who configure boundaries, categories, policies, moderator access, and retention.
- **Response partners** who receive relevant high-priority, permissioned updates.

## Product principles

1. **Uncertainty is a first-class state.** Show what is known, what is merely reported, and what still needs review.
2. **Reports and incidents are different objects.** Many reports can reference one incident without erasing authorship or timestamps.
3. **Verification is a human-governed action.** AI may assist; it never grants verified status.
4. **Freshness matters.** A true report from yesterday may no longer be useful for a fast-changing hazard.
5. **Privacy by default.** Collect only the location, identity, media, and history needed for the product purpose.
6. **Accessible, calm communication.** Use plain language, clear labels, readable contrast, and avoid sensational wording.

## Product experience

| Area | What it does |
| --- | --- |
| **Campus Pulse feed** | Ranked list of active incidents with category, status, last update, location context, and report count. |
| **Campus map** | Incident markers and affected areas from supported geographic data, with a list fallback when maps fail. |
| **Report an incident** | Structured observation: category, description, location, observed time, optional photo, review, submit. |
| **Incident detail** | One incident as it evolves: summary, status, timeline, report count, freshness, verification notes, corrections. |
| **Updates and alerts** | Opt-in category and area subscriptions with deduplicated push and in-app notifications. |
| **Moderator console** | Review queue, evidence panel, map context, merge/split, decision reasons, and audit log. |
| **Campus settings** | Admin-only configuration for boundaries, categories, users, retention, and escalation rules, with change history. |

The student app is designed around four destinations: **Pulse**, **Map**, **Report**, and **Saved / Profile**. The central UX rule is simple: a user should never need a second screen to learn whether an incident is reported, corroborated, verified, resolved, or stale.

## Campus Pulse

Campus Pulse is AlertU's signature experience. It is not a map full of pins; it is the incident aggregation and update system that turns separate observations into a traceable shared picture.

1. A student submits a structured report. It exists immediately as a **Reported** observation.
2. A matching service may suggest that other reports describe the same event. Every suggestion includes its rationale and remains a proposal.
3. Related reports become a **candidate incident**, but each original report remains inspectable evidence with its own author and timestamps.
4. A moderator accepts the cluster, splits it, requests more evidence, disputes it, rejects it, or records a reasoned verification decision.
5. The public incident timeline updates with the new status, latest observation, and last-updated time.
6. Subscribers receive a deduplicated notification only when the change is materially useful.

An incident card carries:

- Title and category
- Approximate location and affected area
- Status and last-updated time
- Distinct report count and reporting times
- Timeline and freshness or expiry warning
- Evidence and confidence context
- A route alternative only when a real routing source returns a valid path

Report volume is supporting context, never proof.

## Incident lifecycle

Status changes follow a controlled model. Public labels stay understandable; review details stay auditable.

| Status | Meaning to the user | What it does not mean |
| --- | --- | --- |
| **Reported** | At least one person submitted an observation. | Not independently confirmed. |
| **Candidate** | Reports may refer to the same event. | Not a claim that the event happened as described. |
| **Corroborated** | Multiple eligible signals are consistent. | Not verified truth; reports may share a source or be mistaken. |
| **Under review** | A moderator is assessing evidence. | Not yet verified. |
| **Verified** | A moderator applied the evidence policy and recorded a reason. | Not a permanent guarantee; conditions change. |
| **Disputed / Rejected** | Credibility is challenged, or the item should not be published as active. | Never silently erased; the audit trail remains. |
| **Resolved / Expired / Reopened** | No longer active, no longer current, or new evidence warrants attention. | Resolved does not mean the incident never occurred. |

Every moderator decision records the actor, action, before and after status, reason code, evidence note, and timestamp.

## AI and trust boundaries

AI is an organizer and reviewer assistant. Every model output is a proposal with provenance, not an authoritative decision.

| AI may assist with | Guardrail |
| --- | --- |
| Possible duplicate matching | Suggestions include matching reasons; uncertain matches stay separate or go to review. |
| Category suggestion | Users and moderators can correct it; no unsupported claims of danger or intent. |
| Summary drafting | Attributed phrasing only: "Students report…"; unverified claims stay separate. |
| Spam and abuse triage | Priority signals for humans; no automatic punishment from a model score alone. |
| Translation and normalization | Original text is preserved and translations are labeled. |

AI must never:

- Declare an incident true because reports match or cluster.
- Automatically verify a hazard, accuse a named person, or infer criminal intent.
- Invent routes, closures, facilities, emergency contacts, or evidence.
- Silently merge or split incident records, hide corrections, or make unreviewable high-impact decisions.

Public summaries separate what people reported from what moderators verified. For example: *"Three reports describe flooding near the east walkway. Not yet verified. Last report 4 min ago."*

## Routing, privacy, and safety

**Routing policy**

- Represent an affected path or area only when the incident location and scope are usable.
- Query a real routing provider with current path-graph data and known closures.
- Validate that the returned route connects origin and destination and avoids the affected segment.
- Show only routes returned by the routing engine, with coverage and freshness caveats.
- If no valid route exists, say **"No verified alternative available"** and offer neutral next steps. Never generate a route.

**Privacy and abuse controls**

- Reporter identity is not public by default; metadata access is limited by role and purpose.
- Location is requested explicitly for the incident, with manual map selection where possible. No continuous tracking by default.
- Media uploads are optional, access-restricted, and covered by retention rules.
- Stale incidents are visibly marked, and users can submit an update or correction.
- Escalation contacts are human-owned and configured. The app never implies emergency services were notified unless an integration confirms it.

## Architecture

AlertU starts as a modular monolith with clear service boundaries. Slower AI work can move to a queue without introducing distributed complexity too early.

```text
┌──────────────────┐          ┌────────────────────┐
│  Student mobile  │          │   Moderator web    │
│   Expo / RN      │          │    React + Vite    │
└────────┬─────────┘          └─────────┬──────────┘
         │        REST · SSE/WebSocket  │
         └───────────────┬──────────────┘
                         ▼
                ┌──────────────────┐
                │   API service    │
                │ Node + Express   │
                └───┬──────────┬───┘
                    │          │
          ┌─────────▼──┐   ┌───▼──────────────┐
          │ PostgreSQL │   │ AI review worker │
          │  + PostGIS │   │ queue + adapter  │
          └────────────┘   └───┬──────────────┘
                               │
                      ┌────────▼─────────┐
                      │ Routing and maps │
                      │ external provider│
                      └──────────────────┘
```

Key architectural rules:

- AI is a replaceable adapter. Report submission and incident display must work if the model provider is unavailable.
- Realtime is a delivery mechanism, not the source of truth. The database and audit log remain authoritative.
- Map and route claims come from a licensed, current data source, never from generated text.
- Location is stored with geographic types and indexing, with permission and retention rules confirmed first.

## Tech stack

| Layer | Current choice | Status |
| --- | --- | --- |
| Student mobile app | Expo SDK 57, React Native 0.86, React 19, TypeScript, Expo Router | Starter scaffold |
| Moderator web app | React 19, Vite 8, JavaScript | Scaffold |
| API | Node.js, Express 5, TypeScript, `tsx` | Dependencies and TypeScript config only |
| Data | PostgreSQL, Sequelize, PostGIS for spatial queries | Planned |
| AI assistance | Provider-agnostic background worker with queue | Planned |
| Live updates | WebSocket/SSE plus push notifications | Planned |
| Maps and routing | External licensed map and routing provider | Planned |
| Media and observability | Private object storage, structured logs, monitoring, backups | Planned |

## Repository layout

```text
AlertU/
├── mobile/               # Student app: Expo + React Native + TypeScript
│   └── src/
│       ├── app/          # Expo Router routes (_layout, index, explore)
│       ├── components/   # Shared UI components
│       ├── constants/    # Theme tokens and spacing
│       └── hooks/        # Theme and color-scheme hooks
├── Frontend AlertU/      # Moderator web client: React + Vite (scaffold)
├── backend/              # API service: Node + Express + TypeScript (scaffold)
└── README.md
```

> The web client folder name contains a space. Quote it in shell commands: `cd "Frontend AlertU"`.

## Project status

**AlertU is in early development.** The product behavior and safety principles in the Product and Functional Blueprint (v1.0, 23 October 2026) define the target. The repository currently contains the foundation for that build.

| Area | What exists today |
| --- | --- |
| Repo and tooling | npm-based monorepo with independent client and backend packages |
| Mobile app | Expo starter that runs on Android, iOS, and web; tab navigation, light/dark theming, splash overlay |
| Web client | Vite + React starter with an empty app shell |
| API | Express, Sequelize, and PostgreSQL dependencies installed; no routes, models, or entry point yet |
| Product features | Not implemented yet |

The next milestone is the smallest trustworthy loop: a student can submit a report, related reports can form a reviewable candidate incident without deleting originals, and a moderator decision appears in a timestamped public timeline.

## Getting started

### Prerequisites

- **Node.js** `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0` (Node 22 LTS recommended)
- **npm** 10 or newer
- **Git**
- For mobile: [Expo Go](https://expo.dev/go) on a physical device, or Android Studio / Xcode with an emulator or simulator
- For backend work: PostgreSQL 16 or newer, with PostGIS when spatial features begin
- For iOS builds: macOS with Xcode

### Clone the repository

```bash
git clone https://github.com/Promise278/AlertU.git
cd AlertU
```

### Run the student mobile app

```bash
cd mobile
npm install
npx expo start
```

Then:

- Press `a` for an Android emulator or connected device.
- Press `i` for the iOS simulator (macOS only).
- Press `w` for the web build.
- Or scan the QR code with Expo Go on a physical device connected to the same network.

The project targets **Expo SDK 57**. Use a current Expo Go build, or create a development build if a future native module is not included in Expo Go:

```bash
npx expo run:android
# or
npx expo run:ios
```

### Run the moderator web client

```bash
cd "Frontend AlertU"
npm install
npm run dev
```

Vite serves the scaffold at `http://localhost:5173`. The moderator experience is not built yet.

### Run the backend

```bash
cd backend
npm install
```

The API has no entry point or scripts yet. The planned development command, once `src/server.ts` lands, is:

```bash
npx tsx watch src/server.ts
```

Planned source layout:

```text
backend/src/
├── routes/        # HTTP endpoints and request validation
├── controllers/   # Request orchestration
├── models/        # Sequelize models and associations
├── services/      # Business rules, AI adapter, routing adapter
└── server.ts      # Application entry point
```

### Android environment

Expo needs the Android SDK tools on `PATH`. Add this to `~/.bashrc` or `~/.zshrc` if `adb` and `emulator` are not found:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

Start an emulator before running `expo start` and confirm it is visible:

```bash
emulator -avd <avd-name>
adb devices
```

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| `No Android connected device found` | Start the emulator first and confirm `adb devices` lists it as `device`, not `offline`. |
| Expo cannot find `adb` or `emulator` | Load the Android environment above in the same terminal, then restart Expo. |
| Expo Go install fails with `INSTALL_PARSE_FAILED_NO_CERTIFICATES` | Clear the corrupted cache with `rm -rf ~/.expo/android-apk-cache` and retry. |
| Port `8081` is already in use | An Expo server is already running; press `a` in that terminal, or start with `npx expo start --port 8082`. |
| Dependency or config warnings | Run `npx expo-doctor` inside `mobile/`, then `npx expo install --fix`. |

## Environment configuration

No environment file is needed to run the current mobile starter. The planned backend configuration is:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port, default `4000` |
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGIN` | Allowed web client origin |
| `AI_PROVIDER` | AI adapter selection |
| `AI_API_KEY` | Provider credential, server-side only |
| `MAPS_PROVIDER` | Map and routing provider |
| `MAPS_API_KEY` | Provider credential, server-side only |
| `PUSH_PROVIDER_KEY` | Push notification credential |

Never commit `.env` files or provider keys. Keep all model, map, and push credentials on the server.

## Roadmap

The delivery plan builds the smallest trustworthy loop first: reports become a reviewable incident, and students see a useful, honest update.

| Phase | Ship | Exit criteria |
| --- | --- | --- |
| **0. Foundation** *(in progress)* | Campus map and boundary, roles, incident taxonomy, privacy and moderation policy, seeded demo data | Team agrees on status definitions, evidence rules, data ownership, and the demo scenario |
| **1. Reporting** | Structured report form, validation, storage, manual incident creation, basic feed and detail | A student can report and see the submission reflected with timestamp and location context |
| **2. Campus Pulse** | Candidate clustering suggestions, report-to-incident links, status timeline, moderator merge and split | Three related reports form one candidate while every original report remains inspectable |
| **3. Verification and live updates** | Moderator review, status transitions, realtime feed refresh, notification preferences | A moderator can verify, dispute, or resolve with a reason, and subscribers see a timestamped update |
| **4. Route integration** | Real path graph and provider, incident restrictions, validated alternatives, no-route fallback | Every route shown comes from routing data and avoids known affected segments |
| **5. Hardening** | Abuse tests, monitoring, backup and restore, accessibility, security review, field pilot | Operational owner, incident response, retention, and rollback are documented |

## Quality gates

These tests must pass before an external campus pilot:

- [ ] Three similar reports group into one candidate; unrelated nearby reports remain separate.
- [ ] A candidate cannot become **Verified** through report count, AI score, or timeout alone.
- [ ] Moderator merge, split, and status changes preserve timestamps and an audit trail.
- [ ] Stale incidents are visibly stale; resolved incidents stay in history without appearing active.
- [ ] No route is shown when the routing source returns no valid path or its data is unavailable.
- [ ] The app degrades cleanly when the AI provider, map provider, push system, or network is unavailable.

## Contributing

Contributions are welcome while the foundation is being built.

1. Create a focused branch: `feat/report-form`, `fix/stale-status`, `docs/readme`.
2. Keep changes scoped and explain the behavior they change.
3. For mobile changes, run the checks before opening a pull request:

   ```bash
   cd mobile
   npx expo lint
   npx tsc --noEmit
   npx expo-doctor
   ```

4. For trust-sensitive changes (statuses, verification, moderation, AI output, routing, privacy), describe the safety implications in the pull request.
5. Never commit credentials, real student data, or unredacted evidence.
6. Preserve the separation between reports and incidents, and never remove audit history to simplify a screen.

## License

There is no root license file yet. The mobile package includes the MIT license from the Expo template it was created from. Until a project-wide license is chosen, treat the repository as all rights reserved and add a `LICENSE` file before distributing the project or accepting external contributions.

## Acknowledgements

- Product direction: **AlertU Product and Functional Blueprint**, v1.0, 23 October 2026.
- Mobile foundation: [Expo](https://expo.dev) and [React Native](https://reactnative.dev).
- Web foundation: [React](https://react.dev) and [Vite](https://vite.dev).
- Built for the students, moderators, and campus teams who need a clearer picture of what is actually happening.

---

<div align="center">

**Campus Pulse reduces noise without manufacturing certainty.**

*It groups observations, preserves evidence, shows what is known, and makes human verification visible.*

</div>
