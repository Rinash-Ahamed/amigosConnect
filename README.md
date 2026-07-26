# AMIGOS Connect

AMIGOS Connect is a production-oriented Next.js PWA for staff management,
attendance, leave requests, salary advances, and payroll reporting. It has an
owner/manager dashboard and a PIN-based employee portal backed by the existing
Firebase Firestore project.

## Technology

- Next.js 16 App Router
- React 19
- TypeScript with strict checking for TypeScript modules
- Firebase Firestore
- Recharts
- Lucide React
- ESLint with the Next.js Core Web Vitals and TypeScript rules

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the public Firebase web-app
   configuration:

   ```dotenv
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   ```

   Also configure the server-only development login override and session secret:

   ```dotenv
   DEV_PASSWORD=
   AUTH_SECRET=
   ```

   `DEV_PASSWORD` can log into either staff role only while running `next dev`.
   Use it to create the initial Owner and Manager passwords from each role's
   Account screen. The role passwords are stored as salted hashes in
   `amigos_store/staffAuth` in Firestore. Use a long random value for
   `AUTH_SECRET`. Neither server-only value may use a `NEXT_PUBLIC_` prefix.

3. Start development:

   ```bash
   npm run dev
   ```

4. Open <http://localhost:3000>.

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
│   ├── error.tsx
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── manifest.ts
│   ├── not-found.tsx
│   └── page.tsx
├── components/
│   └── pwa/
│       └── ServiceWorkerRegistration.tsx
├── features/
│   └── app/
│       └── AppClient.jsx
├── lib/
│   └── firebase/
│       └── client.ts
├── services/
│   └── storage.ts
├── styles/
│   └── globals.css
└── types/
    └── domain.ts
```

The route and layout are Server Components. `AppClient` is the browser boundary
because the application uses employee session storage, Firestore subscriptions,
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
- `amigos_store/staffAuth`

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
- Employee PIN behavior is preserved for compatibility. Review the Firestore
  security rules before exposing the system beyond its current trusted
  deployment model.
- `firebase.json` points to the checked-in `firebase_rules` and empty
  `firestore.indexes.json` files. Create a new Firebase project, add its web-app
  values to `.env.local`, select the project with the Firebase CLI, and review
  the rules before deploying them.
