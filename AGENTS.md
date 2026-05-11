# AGENTS.md - AI Coding Assistant Guidelines for AMIGOS Connect

## Project Overview
AMIGOS Connect is a PWA staff management & payroll platform with dual portals (Owner/Manager Dashboard + Employee Portal). Built with React 19, Vite, and Firebase Firestore.

See [README.md](README.md) for comprehensive feature documentation.

## Quick Start
- `npm install` - Install dependencies
- `npm run dev` - Start dev server at http://localhost:5173
- `npm run build` - Production build
- `npm run lint` - ESLint check

## Architecture
- **Monolithic Structure**: All components and logic in [src/App.jsx](src/App.jsx) (2752 lines)
- **Firebase Integration**: Firestore collections (employees, timelogs, leaves, advances, branches)
- **Custom Storage Abstraction**: `storage.get/add/update/remove/subscribe` methods in App.jsx
- **PWA Features**: Service Worker in [public/sw.js](public/sw.js), manifest in [public/manifest.json](public/manifest.json)

## Conventions
- Components: PascalCase (e.g., `EmployeeView`, `OwnerDashboard`)
- Functions: camelCase (e.g., `clockIn`, `hoursWorked`)
- Constants: UPPERCASE_SNAKE_CASE (e.g., `IST_OFFSET_MS`)
- Dates: ISO UTC strings, displayed via `fmt()` utility
- Timezone: Hard-coded IST (5.5 hours ahead of UTC) - pitfall for non-India deployments
- Styling: CSS-in-JS in `<GlobalStyle>` component with custom properties

## Pitfalls
- Single-file monolith: Use Ctrl+F to navigate App.jsx
- No TypeScript: Rely on JSDoc for type hints
- Master password in cleartext: Use encryption for production
- Auto-cleanup on read: Data not deleted in real-time
- Hard-coded Firebase config: Update lines 14-19 in App.jsx for different projects

## Key Files
- [src/App.jsx](src/App.jsx): Root component with all logic and components
- [src/main.jsx](src/main.jsx): Entry point and Service Worker registration
- [firebase.json](firebase.json): Firestore configuration
- [package.json](package.json): Dependencies and scripts</content>
<parameter name="filePath">c:\Users\rinas\Project\amigosConnect\AGENTS.md