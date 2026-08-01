# AMIGOS Fashion + Connect

This repository hosts both the public AMIGOS Fashion website and the private
AMIGOS Connect staff-management portal in one production-oriented Next.js
application.

- `/` is the public fashion website.
- `/collections`, `/about`, `/size-guide`, and `/contact` are public pages.
- `/connect` is the Owner, Manager, and employee portal.
- `/api/*` contains server-only authentication and backend endpoints.

## Technology

- Next.js 16 App Router
- React 19
- TypeScript with strict checking for TypeScript modules
- Firebase Firestore
- GSAP and Lenis for public-site motion and smooth scrolling
- Recharts
- Lucide React
- ESLint with the Next.js Core Web Vitals and TypeScript rules

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add the server-only Firestore Admin
   credentials and session secret. Keep the private key on one line with
   escaped newlines:

   ```dotenv
   FIREBASE_PROJECT_ID=
   FIREBASE_CLIENT_EMAIL=
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
   AUTH_SECRET=
   DEV_PASSWORD=
   DEV_EMPLOYEE_PIN=
   ```

   `DEV_PASSWORD` can log into either staff role only while running `next dev`.
   `DEV_EMPLOYEE_PIN` must contain exactly six digits and logs into the first
   available employee account only while running `next dev`.
   Use it to create the initial Owner and Manager passwords from each role's
   Account screen. The role passwords are stored as salted hashes in
   separate `amigos_store/ownerAuth` and `amigos_store/managerAuth` documents
   in Firestore. Use a long random value for
   `AUTH_SECRET`. All Firestore access goes through authenticated server routes,
   so no `NEXT_PUBLIC_FIREBASE_*` variables are required.

3. Start development:

   ```bash
   npm run dev
   ```

4. Open <http://localhost:3000> for the public website or
   <http://localhost:3000/connect> for the Connect portal.

## Production

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

The production server uses port 3000 by default.

## Project structure

```text
src/
├── app/
│   ├── (public)/             # Public website routes and metadata
│   ├── connect/              # Connect portal route
│   ├── api/                  # Server-only authentication endpoints
│   ├── layout.tsx
│   └── manifest.ts
├── components/
│   └── pwa/
│       └── ServiceWorkerRegistration.tsx
├── features/
│   ├── public/               # Public pages, components, hooks, and styles
│   └── connect/
│       └── AppClient.jsx     # Staff-management application
├── lib/
│   ├── auth/                 # Session and role credential services
│   └── firebase/             # Client and Admin Firestore initialization
└── styles/
│   └── globals.css
```

Public routes use a dedicated layout so their fashion design and animations do
not leak into the Connect interface. `AppClient` is the Connect browser boundary
because that portal uses employee session storage, authenticated data polling,
timers, install prompts, and interactive forms. Owner and Manager passwords are
validated by API routes against salted hashes in Firestore, and staff sessions
use signed HTTP-only cookies.

## Data compatibility

The existing Firestore collections and document structures are preserved:

- `employees`
- `timelogs`
- `leaves`
- `advances`
- `branches`
- `amigos_store/appSettings`
- `amigos_store/ownerAuth`
- `amigos_store/managerAuth`

The app starts with empty Firestore collections and contains no old-project
migration, age-based retention, or automatic record deletion paths. Firebase
initialization is guarded against duplicate initialization.

## PWA behavior

Next.js generates `/manifest.webmanifest` from `src/app/manifest.ts`. The service
worker is registered only in production and uses a network-first strategy for
App Router navigations. Development deliberately skips service-worker
registration so stale caches do not interfere with local work.

## Notes

- The application currently applies India Standard Time (UTC+05:30) to automatic
  clock-out behavior.
- Owner has payroll, salary advance, salary-field, export, and settings access.
- Manager can manage attendance, leave, and staff profiles but salary-sensitive
  navigation and values are excluded.
- Owner, Manager, and Employee sessions terminate after 15 minutes without
  keyboard, pointer, scroll, or touch activity. Active staff sessions renew
  their signed HTTP-only cookie periodically.
- Employee login requires a unique six-digit numeric PIN. Review the Firestore
  security rules before exposing the system beyond its current trusted
  deployment model.
- `firebase.json` points to the checked-in `firebase_rules` and empty
  `firestore.indexes.json` files. Create a new Firebase project, add its web-app
  values to `.env.local`, select the project with the Firebase CLI, and review
  the rules before deploying them.
