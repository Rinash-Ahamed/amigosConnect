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

   These values initialize the Firebase client SDK. Do not add Firebase Admin
   credentials or other server secrets to `NEXT_PUBLIC_` variables.

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
because the application uses local session storage, Firestore subscriptions,
timers, install prompts, and interactive forms.

## Data compatibility

The existing Firestore collections and document structures are preserved:

- `employees`
- `timelogs`
- `leaves`
- `advances`
- `branches`
- `amigos_store/appSettings`
- `amigos_store/ownerPass`

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
- Owner and employee sessions remain client-side and automatically expire after
  five minutes of inactivity.
- PIN/password behavior is preserved for compatibility. Review the Firestore
  security rules and migrate clear-text credentials before exposing the system
  beyond its current trusted deployment model.
- `firebase.json` points to the checked-in `firebase_rules` and empty
  `firestore.indexes.json` files. Create a new Firebase project, add its web-app
  values to `.env.local`, select the project with the Firebase CLI, and review
  the rules before deploying them.
