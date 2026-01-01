# Firestore Structure & Security Rules Documentation

## Firestore Database Structure

### Collection: `users`

Stores user authentication data and role assignments.

**Purpose:** Map Firebase auth UID to user role and metadata.

**Document ID:** Firebase Auth UID (auto-generated on signup)

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ | User's email address |
| `role` | string | ✅ | User role: `admin` or `ops` |
| `createdAt` | timestamp | ✅ | Account creation timestamp |

**Example Document:**
```json
{
  "email": "admin@example.com",
  "role": "admin",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Queries:**
- Fetch by UID: `doc(db, 'users', firebaseUser.uid)` — reads role on login (AuthContext)

---

### Collection: `staff_compliance`

Stores staff member records with license and DBS expiry tracking.

**Purpose:** Manage staff records, track compliance status based on expiry dates.

**Document ID:** Auto-generated (Firestore generates unique ID)

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `staffName` | string | ✅ | Staff member's full name |
| `role` | string | ✅ | Staff role: `Admin` or `Operations` |
| `dbsExpiryDate` | string | ✅ | DBS expiry date (format: `YYYY-MM-DD`) |
| `licenseExpiryDate` | string | ✅ | License expiry date (format: `YYYY-MM-DD`) |
| `createdAt` | timestamp | ✅ | Record creation timestamp |
| `lastUpdated` | timestamp | ✅ | Last modification timestamp |

**Example Document:**
```json
{
  "staffName": "John Doe",
  "role": "Operations",
  "dbsExpiryDate": "2025-06-30",
  "licenseExpiryDate": "2025-12-31",
  "createdAt": "2024-01-10T14:20:00Z",
  "lastUpdated": "2024-01-15T09:45:00Z"
}
```

**Compliance Calculation:**
- **Compliant:** License expiry date >30 days from today
- **Expiring Soon:** License expiry date ≤30 days from today (but not expired)
- **Non-Compliant:** License expiry date ≤ today (expired)

**Implemented in:** `utils/complianceHelper.ts` — `calculateComplianceStatus(licenseExpiryDate)`

**Queries:**
- List all: `query(collection(db, 'staff_compliance'), orderBy('staffName'))`
- Add: `addDoc(collection(db, 'staff_compliance'), {...})`
- Update: `updateDoc(doc(db, 'staff_compliance', staffId), {...})`
- Delete: `deleteDoc(doc(db, 'staff_compliance', staffId))`

---

### Collection: `routes`

Stores route planning records with staff assignment and approval status.

**Purpose:** Manage delivery/service routes, track approval status, enforce compliance-based approvals.

**Document ID:** Auto-generated (Firestore generates unique ID)

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `routeName` | string | ✅ | Route identifier/name |
| `plannedJourneyMinutes` | number | ✅ | Estimated journey time in minutes |
| `staffId` | string | ✅ | Document ID of assigned staff (reference to `staff_compliance`) |
| `approved` | boolean | ✅ | Approval status |
| `approvedAt` | timestamp | ❌ | Timestamp when route was approved |
| `createdAt` | timestamp | ✅ | Route creation timestamp |

**Example Document:**
```json
{
  "routeName": "Route-A-North",
  "plannedJourneyMinutes": 50,
  "staffId": "staff_compliance_doc_id_123",
  "approved": true,
  "approvedAt": "2024-01-15T11:00:00Z",
  "createdAt": "2024-01-15T10:45:00Z"
}
```

**Approval Logic:**

| Journey Time | Approval Requirement |
|--------------|---------------------|
| ≤45 minutes | Auto-approved (no compliance check needed) |
| >45 minutes | Requires assigned staff to be **Compliant** |

**Implementation:** `app/admin/data/page.tsx` — `handleApprove()` function

**Queries:**
- List all: `query(collection(db, 'routes'), orderBy('routeName'))`
- Add: `addDoc(collection(db, 'routes'), {...})`
- Update approval: `updateDoc(doc(db, 'routes', routeId), { approved: true, approvedAt: new Date() })`
- Delete: `deleteDoc(doc(db, 'routes', routeId))`

---

## Firestore Security Rules

Security rules enforce role-based access control (RBAC) and prevent unauthorized data modifications.

**Location:** `firebase/firestore.rules` (in repo) and Firebase Console

### Rules Overview

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Users collection - own document only
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Data collection - All authenticated users can read
    match /data/{docId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && getUserRole() == 'admin';
    }

    // Staff Compliance collection
    match /staff_compliance/{staffId} {
      // Admin: Full access (create, read, update, delete)
      allow read: if request.auth != null;
      allow read, create, update, delete: if request.auth != null && getUserRole() == 'admin';
    }
      
    // Routes collection - NEW
    match /routes/{routeId} {
      // Admin: Full access (create, read, update, delete)
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && getUserRole() == 'admin';
      
      // Ops: Read-only access
      allow read: if request.auth != null && getUserRole() == 'ops';
    }
  }
}
```

### Key Features

- **Helper Function:** `getUserRole()` retrieves the user's role from the `users` collection, reducing code duplication
- **Users Collection:** Authenticated users can only read/write their own document
- **Data Collection:** All authenticated users can read; only admins can create/update/delete
- **Staff Compliance:** All authenticated users can read; only admins can manage staff records
- **Routes Collection:** All authenticated users can read; only admins can create/update/delete routes

---

## Role Definitions

### Admin Role (`admin`)
- **Dashboard:** `/admin/dashboard`
- **Permissions:**
  - ✅ View all staff compliance records
  - ✅ Create, edit, delete staff members
  - ✅ View all routes
  - ✅ Create, delete, approve routes
  - ✅ Trigger approval logic (compliance checks)

### Operations Role (`ops`)
- **Dashboard:** `/ops/dashboard`
- **Permissions:**
  - ✅ View staff compliance records (read-only)
  - ❌ Cannot manage staff
  - ✅ View routes (read-only)
  - ❌ Cannot create, delete, approve routes

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Authentication                       │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ├─ Firebase Auth (email/password)
                   │
                   ├─ AuthContext fetches user.role from users/{uid}
                   │
                   └─ Routes user to:
                      ├─ /admin/dashboard (if role == 'admin')
                      └─ /ops/dashboard (if role == 'ops')
                   
┌─────────────────────────────────────────────────────────────────┐
│                   Admin Dashboard Features                       │
└──────────────────┬──────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────────┐      ┌─────▼────────┐
    │ Staff CRUD │      │ Route Manager │
    │            │      │               │
    │ - Create   │      │ - Create      │
    │ - Read     │      │ - Read        │
    │ - Update   │      │ - Approve*    │
    │ - Delete   │      │ - Delete      │
    │            │      │               │
    └──┬─────────┘      └─┬──────────────┘
       │                  │
       │                  │ *Approval Logic:
       │                  │  - Journey ≤45 min → ready to pprove
       │                  │  - Journey >45 min → check staff compliance
       │                  │
       ▼                  │
    staff_compliance      │
    collection            │
                          ▼
                       routes
                       collection
                       (with staffId reference)

┌─────────────────────────────────────────────────────────────────┐
│                 Operations Dashboard (Read-Only)                 │
└──────────────────┬──────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────────┐      ┌─────▼────────┐
    │ Staff View │      │ Routes View   │
    │            │      │               │
    │ - View     │      │ - View        │
    │            │      │               │
    │            │      │               │
    └────────────┘      └───────────────┘
         │                    │
         ├────────┬───────────┘
         │        │
         ▼        ▼
    Firestore read operations (guarded by security rules)
```

---

## Compliance Status Visualization

**UI Displays Compliance Status Using Colors:**

| Status | Color | Meaning | Days to Expiry |
|--------|-------|---------|----------------|
| **Compliant** | 🟢 Green (#90EE90) | License valid, good standing | >30 days |
| **Expiring Soon** | 🟡 Orange/Yellow (#FFD700) | License valid but expiring | ≤30 days |
| **Non-Compliant** | 🔴 Red (#FF6B6B) | License expired or invalid | ≤0 days (past) |

**Computed in:** `utils/complianceHelper.ts`
```typescript
calculateComplianceStatus(licenseExpiryDate: string): 'Compliant' | 'Expiring Soon' | 'Non-Compliant'
getComplianceColor(status: string): string
```

---

## Data Integrity Notes

1. **Date Format:** All dates stored as `YYYY-MM-DD` strings (ISO format)
2. **Timestamps:** Server-side timestamps (`Timestamp` type) for creation/update tracking
3. **References:** Routes use `staffId` (string) to reference `staff_compliance` documents (client-side joins)
4. **Deletion:** Deleting a staff member does not cascade; routes retain `staffId` but staff record is gone (orphaned reference)
5. **No Validation Server-Side:** Input validation happens in client code; Firestore rules enforce access control only

---

## Deployment Notes

**Deploying Security Rules to Firebase:**

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Deploy: `firebase deploy --only firestore:rules`

**Verify Rules in Firebase Console:**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select project → Firestore Database → Rules tab
- Confirm rules match `firebase/firestore.rules`

**Do Not:** Manually edit rules in the console if you want them version-controlled in the repo; use CLI deployment instead.
