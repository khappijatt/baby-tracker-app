# Parenting Companion App

## Overview

A comprehensive mobile parenting application built with React Native (Expo) and a Node.js/Express backend. The app helps parents track daily activities for children ages 0-5, including feeding, diaper changes, sleep sessions, health records, developmental milestones, and doctor appointments. It also provides educational resources filtered by age and category.

The app supports multiple child profiles and provides a dashboard with daily summaries and upcoming events. The backend exposes a full REST API with 40+ endpoints, and data is persisted in PostgreSQL via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Mobile App)

- **Framework**: React Native with Expo (~54.0.27) using the file-based Expo Router (~6.0.17)
- **Navigation**: Tab-based navigation with 5 visible tabs (Dashboard, Tracking, Analytics, Health, Milestones) plus modal screens for adding and editing a child profile (Resources tab hidden from nav but file remains)
- **State/Data Fetching**: TanStack React Query for server state management, API requests, and caching
- **UI**: Custom color system defined in `constants/colors.ts` (pink-primary theme `#FF6B9D`), Ionicons for icons, Expo linear gradient and blur effects
- **Fonts**: Inter via `@expo-google-fonts/inter`
- **Path Aliases**: `@/` maps to project root; `@shared/` maps to `./shared/`

### Backend (API Server)

- **Framework**: Express.js v5 running as a Node.js server (`server/index.ts`)
- **API Style**: REST with JSON responses, all routes prefixed with `/api`
- **Validation**: Zod schemas generated from Drizzle table definitions via `drizzle-zod`; all timestamp fields use `z.coerce.date()` to accept ISO strings from HTTP requests
- **CORS**: Custom middleware allowing Replit domain origins and localhost origins for Expo development
- **Startup Check**: `server/startup-check.ts` verifies database connectivity on boot

### Database

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (`drizzle-orm/node-postgres`) with schema defined in `shared/schema.ts`
- **Schema Management**: `drizzle-kit` for migrations; run `npm run db:push` to apply schema
- **11 Tables**:
  - `children` — child profiles
  - `feeding_logs` — feeding records (breast/bottle/solid)
  - `diaper_changes` — diaper log entries
  - `sleep_logs` — sleep sessions
  - `growth_measurements` — weight/height/head circumference
  - `milestones` — developmental milestones
  - `appointments` — doctor appointments
  - `vaccinations` — immunization records
  - `medicine_logs` — medication tracking
  - `photo_diary` — photo memories
  - `educational_resources` — parenting guides and articles
- **Seeding**: `server/seed.ts` populates 10 educational resources; run with `npm run db:seed`

### Shared Code

- `shared/schema.ts` is used by both the server (for DB queries) and can be referenced by the client for type safety. Zod schemas are exported for validation on the API layer.

### Build & Deployment

- **Dev mode**: Two processes — `npm run server:dev` (Express backend via `tsx`) and `npm run expo:dev` (Expo Metro bundler)
- **Production build**: `scripts/build.js` handles the static Expo export + Express server via esbuild
- **Environment**: `EXPO_PUBLIC_DOMAIN` must be set for the mobile app to resolve the API URL; `DATABASE_URL` must be set for the backend

## External Dependencies

### Core Services
- **PostgreSQL** — Primary data store; connection via `DATABASE_URL` environment variable
- **Expo Go / EAS** — Mobile app distribution and development; users scan QR code with Expo Go app

### Key Libraries
| Library | Purpose |
|---|---|
| `drizzle-orm` + `drizzle-kit` | ORM and schema migrations for PostgreSQL |
| `drizzle-zod` | Auto-generates Zod validation schemas from Drizzle tables |
| `@tanstack/react-query` | Server state management and API caching on the client |
| `expo-router` | File-based navigation for React Native |
| `@expo/vector-icons` (Ionicons) | Icon set used throughout the UI |
| `expo-image-picker` | Photo diary feature — image selection |
| `expo-haptics` | Tactile feedback on user interactions |
| `react-native-gesture-handler` | Gesture support wrapping the root layout |
| `react-native-reanimated` | Animations |
| `http-proxy-middleware` | Proxy support in development server |
| `pg` | PostgreSQL client for Node.js |
| `express` v5 | HTTP server for the REST API |

### External URLs Referenced in Seed Data
- WHO breastfeeding guides
- CDC SIDS/sleep safety pages
- HealthyChildren.org (AAP)
- CDC developmental milestones

No authentication/authorization system is currently implemented. The `server/storage.ts` file contains a stub `MemStorage` class for a user model, but it is not wired into any routes — this is a placeholder for future auth work.