# Route Planning & Staff Compliance Management System

A Next.js application for managing staff compliance records and route planning with role-based access control (Admin/Operations).

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [Architecture Overview](#architecture-overview)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Firebase account with Firestore and Authentication enabled
- Vercel account (for production deployment)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory with your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
   NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<your-measurement-id>
   ```

4. **Configure Firebase in Vercel (for production):**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project → Settings → Environment Variables
   - Add all `NEXT_PUBLIC_FIREBASE_*` variables with Production environment selected
   - Save and redeploy

### Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Architecture Overview

### Tech Stack
- **Frontend:** Next.js 14+ (App Router) with React
- **Backend:** Firebase (Authentication + Firestore)
- **Styling:** Inline CSS (React styles)
- **Deployment:** Vercel

### Key Architecture Decisions

#### 1. Client-Only Firebase Initialization
Firebase SDK must run only in the browser to avoid server-side initialization errors during build/prerender.

- **File:** `firebase/firebase.config.ts`
- **Pattern:** Guards initialization with `typeof window !== 'undefined'`
- **Exports:** `auth` and `db` which may be `undefined` during SSR

#### 2. Provider Wrapper Pattern
Authentication logic runs only on the client via a dedicated provider component.

- **File:** `components/Providers.tsx`
- **Pattern:** Client-only wrapper (`'use client'`) imported by root layout
- **Purpose:** Ensures `AuthProvider` executes only in browser

#### 3. Guarded Firestore Operations
All Firestore operations check if `db` is initialized before execution.

- **Pattern:** `if (!db) { skip or throw error }`
- **Applied in:** Data pages, hooks (`useStaffCompliance`), AuthContext
- **Result:** No server-side Firebase calls during prerender

#### 4. Role-Based Access Control
Users have roles (`admin` or `ops`) stored in Firestore; permissions enforced via:
- **AuthContext:** Fetches role from `users` collection on login
- **Security Rules:** Firestore rules restrict data access by role
- **UI Logic:** Components conditionally render based on `useAuth().role`

### Application Flow

```
User visits app
    ↓
Root layout loads Providers wrapper
    ↓
AuthProvider runs useEffect in browser only
    ↓
Firebase auth initializes (client-side)
    ↓
onAuthStateChanged listener checks login status
    ↓
If logged in: fetch user role from Firestore → set context
If not logged in: redirect to /login
    ↓
User routed to /admin/dashboard or /ops/dashboard based on role
    ↓
Data components query Firestore collections (guarded with db check)
```

### Directory Structure

```
app/
├── admin/
│   ├── dashboard/        # Admin staff compliance & route management
│   └── data/            # Route planning UI
├── ops/
│   ├── dashboard/       # Operations staff compliance view & route view
│   └── layout.tsx
├── login/
│   └── page.tsx         # Authentication form
├── layout.tsx           # Root layout with Providers
└── page.tsx             # Entry point (redirects to dashboard)

components/
├── Providers.tsx        # Client-only auth provider wrapper
├── DataTable.tsx
└── ProtectedRoute.tsx

context/
└── AuthContext.tsx      # Auth state, user, role, logout logic

firebase/
├── firebase.config.ts   # Client-only Firebase initialization
└── firestore.rules      # Security rules definition

hooks/
├── useAuth.ts           # Hook to access AuthContext
├── useRole.ts           # Hook to get current user's role
└── useStaffCompliance.ts # Hook for staff CRUD operations

utils/
└── complianceHelper.ts  # Compliance status calculation from expiry dates
```

## Environment Configuration

### NEXT_PUBLIC_FIREBASE_* Variables

These are **client-facing** credentials (prefix `NEXT_PUBLIC_` means they're embedded in the browser bundle). They enable your app to connect to Firebase:

| Variable | Example | Source |
|----------|---------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `my-app.firebaseapp.com` | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `my-app-f7344` | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `my-app.appspot.com` | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `435682841568` | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:435682841568:web:...` | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-K9N0KSELR1` | Firebase Analytics (optional) |

### Local Development
Add all variables to `.env.local` (gitignored, not committed).

### Production (Vercel)
Add all variables via Vercel Dashboard → Project Settings → Environment Variables with **Production** scope selected.

## Running the Application

### Development
```bash
npm run dev
```
Runs Next.js dev server at `http://localhost:3000` with hot reload.

### Build for Production
```bash
npm run build
```
Compiles and optimizes for deployment. Firebase must initialize client-only (no errors).

### Start Production Server Locally
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
vercel --prod
```
Pushes current commit to Vercel. Ensure environment variables are set in Vercel Dashboard first.

## Deployment

### Vercel Deployment Checklist

1. ✅ Environment variables set in Vercel project settings
2. ✅ `.env.local` is in `.gitignore` (secrets not committed)
3. ✅ Firebase config uses client-only init (guards with `typeof window`)
4. ✅ All Firestore operations guarded with `if (!db)` checks
5. ✅ AuthProvider is in client-only Providers wrapper
6. ✅ Firestore security rules deployed to Firebase Console

### Common Issues & Fixes

**Error: `Firebase: Error (auth/invalid-api-key)`**
- **Cause:** Vercel lacks environment variables
- **Fix:** Add `NEXT_PUBLIC_FIREBASE_*` vars to Vercel project settings → redeploy

**Error: `Cannot read properties of undefined (reading 'onAuthStateChanged')`**
- **Cause:** Firebase not initialized before use
- **Fix:** Ensure `firebase/firebase.config.ts` guards `window` and exports `auth`/`db`

**Build fails with Firebase errors**
- **Cause:** Firebase SDK initializing on server during build
- **Fix:** Ensure all imports of `@/firebase/firebase.config` are in client components or guarded with `'use client'`

## Feature Overview

### Admin Dashboard (`/admin/dashboard`)
- View staff compliance records with dynamic status (Compliant / Expiring Soon / Non-Compliant)
- Create, edit, delete staff records
- View staff role and license/DBS expiry dates

### Route Planning (`/admin/data`)
- Create routes with journey time estimates
- Assign staff to routes
- Auto-approve routes ≤45 minutes
- Require compliance check for routes >45 minutes
- Delete routes

### Operations Dashboard (`/ops/dashboard`)
- Read-only view of staff compliance records
- Read-only view of routes assigned to staff
- See compliance alerts per route
- Cannot create, edit, delete, or approve

### Compliance System
- **Compliant:** License expires >30 days in future
- **Expiring Soon:** License expires in ≤30 days
- **Non-Compliant:** License expired

See [FIRESTORE_DOCUMENTATION.md](./FIRESTORE_DOCUMENTATION.md) for detailed data structure and security rules.
