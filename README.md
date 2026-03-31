# Crisp Order Management — UX Sandbox

A standalone UX sandbox that reproduces the user experience, page structure, navigation, and main flows of the Crisp Order Management System — without any backend dependency.

**Purpose:** Enable UX developers, designers, and product teams to explore, iterate on, and extend the interface without needing the real backend, Auth0, or database infrastructure.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174).

No Auth0, no backend, no environment variables needed. The sandbox runs entirely on mock data.

## What Is Recreated

### Shell & Navigation
- Left sidebar with all navigation items (collapse/expand, dark/light theme, localStorage persistence)
- System admin horizontal sub-navigation
- User profile section with avatar, theme toggle
- Toast notification system (success, error, warning, info with auto-dismiss)
- Responsive sidebar behavior (768px, 480px breakpoints)

### Fully Built Pages

| Page | Route | What works |
|------|-------|------------|
| **Landing Page** | `/` | Dashboard cards, recent orders, navigation to other pages |
| **Supplier Browse** | `/suppliers` | Full CRUD: create via modal, AG Grid with sorting/filtering, click-to-detail, delete confirmation |
| **Supplier Detail** | `/suppliers/:id` | View, edit (modal), delete with confirmation, back navigation |
| **Order Browse** | `/orders` | Quick find by PO number (starts with/contains/ends with), multi-match chooser modal, batch select, batch delete (admin only), selection toolbar |
| **Incoming Data** | `/incoming-data` | Multi-select filters (Client/Retailer/Supplier/Source), date range filters, search, detail drawer with record info, reprocess/requeue actions with confirmation, bulk requeue, data display panels |

### Placeholder Pages (route exists, showing placeholder notice)
All other routes from the original app are wired up with placeholder pages:
- Retailers, Retailer-Supplier Connections, Product Hierarchy, Product Categories, Products, Locations, Units of Measure
- Users (admin)
- System Admin: Master Retailers, Field Registry, Retailer/Client Overrides, Rep Splits
- All detail sub-routes

### Reusable Framework
- `EntityBrowse` — Generic CRUD browse component (powers Supplier Browse and can be extended to all entity pages)
- `useEntityManagement` — Generic hook for entity CRUD state with notification integration
- `useSupplierForm` — Form validation pattern (replicable for other entities)
- `FormField` — Reusable form input wrapper
- `GenericDeleteConfirmationModal` — Entity-agnostic delete confirmation

## What Is Mocked

| Original Dependency | Sandbox Replacement |
|---|---|
| Auth0 (`@auth0/auth0-react`) | `MockSessionProvider` with hardcoded demo user/tenant |
| Session JWT exchange | Skipped — session is always "ready" |
| Tenant selection | Skipped — single "Demo Client" tenant auto-selected |
| All REST API calls | `src/mock/api.ts` with in-memory data + 300-800ms simulated delays |
| `@crisp/crisp-ui` component library | `src/ui/` — lightweight styled component stubs matching the same API |
| Axios HTTP client | Not used — mock API returns data directly |
| Backend validation | Client-side only in form hooks |
| Permissions/RBAC | `isAdmin: true` in mock session (batch delete enabled) |

## What Is Intentionally Excluded

- **Auth0 login/redirect flow** — No authentication required
- **Real multi-tenant switching** — Fixed to single demo tenant
- **Backend business logic** — Order processing, data pipeline, Pub/Sub
- **Server-side pagination** — All data loaded client-side
- **Product hierarchy tree component** — Placeholder page only
- **Category hierarchy tree** — Placeholder page only
- **Retailer settings context** — Not implemented in sandbox
- **Real permission checks** — All pages accessible
- **Data share / Pub/Sub features** — Backend-only, no UI
- **Order modification tracking** — Backend-only, no UI

## How This Maps to the Original Repo

```
Original (crisp-order-management)          Sandbox (this repo)
─────────────────────────────────          ────────────────────
order-management-ui/src/main.tsx        →  src/main.tsx (no Auth0Provider)
order-management-ui/src/App.tsx         →  src/App.tsx (same routes, no AuthGuard)
@crisp/crisp-ui                         →  src/ui/ (lightweight stubs)
order-management-ui/src/components/     →  src/components/
  SessionProvider.tsx                   →  src/mock/SessionProvider.tsx
  NavigationSidebar.tsx                 →  src/components/layout/NavigationSidebar.tsx
  SystemAdminNavigation.tsx             →  src/components/layout/SystemAdminNavigation.tsx
  common/EntityBrowse.tsx               →  src/components/common/EntityBrowse.tsx
  common/FormField.tsx                  →  src/components/common/FormField.tsx
  common/GenericDeleteConfirmationModal →  src/components/common/GenericDeleteConfirmationModal.tsx
  common/CommonComponents.tsx           →  src/components/common/CommonComponents.tsx
  *FormModal.tsx                        →  Inline in page components (SupplierBrowse)
order-management-ui/src/api/           →  src/mock/api.ts (single mock file)
order-management-ui/src/hooks/         →  src/hooks/
order-management-ui/src/types/         →  src/types/
order-management-ui/src/services/      →  src/services/
order-management-ui/src/pages/         →  src/pages/
order-management-ui/src/config/        →  Inline column defs in page components
order-management-ui/src/index.css      →  src/index.css (ported design tokens)
```

## Extending the Sandbox

### Adding a new EntityBrowse page (e.g., Retailers)

1. Create type definitions in `src/types/retailers.ts`
2. Add mock data in `src/mock/data/retailers.ts`
3. Add CRUD functions in `src/mock/api.ts`
4. Create a form hook `src/hooks/useRetailerForm.ts` (follow `useSupplierForm` pattern)
5. Create the page component using `EntityBrowse` (follow `SupplierBrowse` pattern)
6. Update the route in `App.tsx` to point to the new component

### Adding a new form modal

Follow the inline pattern in `SupplierBrowse.tsx` — render a `Modal` with `FormField` components, wire to the form hook's `formData`/`formErrors`/`onInputChange`.

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 6 | Dev server and bundler |
| React Router DOM | 7 | Client-side routing |
| AG Grid Community | 33 | Data grid (same as original) |

## Project Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router + layout shell
├── index.css                   # Design tokens + global styles
├── ui/                         # UI component stubs (replaces @crisp/crisp-ui)
│   ├── index.ts                # Barrel exports
│   ├── ui.css                  # Component styles
│   ├── Button.tsx, Panel.tsx, Card.tsx, Modal.tsx, Drawer.tsx,
│   │   Spinner.tsx, TextField.tsx, SelectField.tsx, Headline.tsx,
│   │   Flex.tsx, Notification.tsx, MultiSelectDropdown.tsx,
│   │   DatepickerButton.tsx, DataGrid.tsx
├── mock/                       # Mock backend replacements
│   ├── SessionProvider.tsx     # Mock auth/session context
│   ├── api.ts                  # Mock API with simulated delays
│   └── data/                   # Mock data fixtures
│       ├── suppliers.ts, retailers.ts, orders.ts,
│       │   incomingData.ts, users.ts
├── components/
│   ├── layout/                 # Shell/navigation
│   │   ├── NavigationSidebar.tsx
│   │   ├── SystemAdminNavigation.tsx
│   │   └── UserProfileSidebar.tsx
│   ├── common/                 # Reusable components
│   │   ├── EntityBrowse.tsx
│   │   ├── FormField.tsx
│   │   ├── GenericDeleteConfirmationModal.tsx
│   │   └── CommonComponents.tsx
│   └── NotificationContainer.tsx
├── pages/                      # Page components
│   ├── LandingPage.tsx
│   ├── SupplierBrowse.tsx
│   ├── SupplierDetail.tsx
│   ├── OrderBrowse.tsx
│   ├── IncomingData.tsx
│   ├── PlaceholderPage.tsx
│   └── PageNotFound.tsx
├── hooks/                      # Custom hooks
│   ├── useEntityManagement.ts
│   └── useSupplierForm.ts
├── types/                      # TypeScript interfaces
│   ├── common.ts, suppliers.ts, retailers.ts,
│   │   order.ts, record.ts, users.ts
├── services/
│   └── NotificationService.ts
└── styles/                     # CSS files
    ├── navigation-sidebar.css
    ├── system-admin-nav.css
    └── user-profile-sidebar.css
```
