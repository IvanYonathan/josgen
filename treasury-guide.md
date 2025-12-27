# Treasury Module Guide

A comprehensive guide to the Treasury Management module in JosGen. This document covers all features, API endpoints, components, and database structure.

---

## Overview

The Treasury module handles:
1. **Treasury Requests** - Fund requests and reimbursements submitted by members
2. **Approval Workflow** - Two-level approval (Leader → Treasurer)
3. **Financial Records** - Direct income/expense entries managed by treasurers
4. **Financial Overview** - Dashboard with charts and statistics

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `treasury_requests` | Main requests (fund requests & reimbursements) with single attachment |
| `treasury_request_items` | Line items for requests (description, amount, category) |
| `treasury_request_approvals` | Approval records (leader/treasurer decisions) |
| `financial_records` | Direct income/expense records (not from requests) |

### Treasury Request Fields
```
id, type (fund_request/reimbursement), title, description, amount, currency
request_date, needed_by_date, status, requested_by, division_id
approved_by, approved_at, approval_notes, payment_method, payment_reference
attachment_filename, attachment_original_name, attachment_path, attachment_type, attachment_size
```

### Status Values
| Status | Description |
|--------|-------------|
| `draft` | Not yet submitted |
| `submitted` | Awaiting leader approval |
| `under_review` | Leader approved, awaiting treasurer |
| `approved` | Fully approved (both levels) |
| `rejected` | Rejected by leader or treasurer |
| `paid` | Payment completed |

---

## Backend (Laravel)

### Models

| Model | Location |
|-------|----------|
| `TreasuryRequest` | `app/Models/TreasuryRequest.php` |
| `TreasuryRequestItem` | `app/Models/TreasuryRequestItem.php` |
| `TreasuryRequestApproval` | `app/Models/TreasuryRequestApproval.php` |
| `FinancialRecord` | `app/Models/FinancialRecord.php` |

### API Endpoints

All endpoints are `POST` requests under `/api/treasury/`:

#### Treasury Requests
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/list` | `list()` | List requests (own or all based on permission) |
| `/get` | `get()` | Get single request with full details |
| `/create` | `create()` | Create new request with items |
| `/update` | `update()` | Update draft/submitted/rejected request |
| `/delete` | `delete()` | Delete draft request |
| `/submit` | `submit()` | Submit for approval or resubmit rejected |
| `/approve` | `approve()` | Approve (leader first, then treasurer) |
| `/reject` | `reject()` | Reject with notes |
| `/stats` | `stats()` | Get statistics and charts data |
| `/categories` | `categories()` | Get expense categories list |

#### Attachments
| Endpoint | Description |
|----------|-------------|
| `/attachment/upload` | Upload single proof file (replaces existing) |
| `/attachment/delete` | Delete attachment from request |

#### Financial Records
| Endpoint | Description |
|----------|-------------|
| `/records/list` | List all records (requires permission) |
| `/records/create` | Create income/expense record |
| `/records/update` | Update existing record |
| `/records/delete` | Delete record |
| `/records/categories` | Get income/expense categories |

---

## Controller Methods Detail

### `TreasuryController.php`

#### `list(Request $request)`
Lists treasury requests with filtering and pagination.
- **Params**: `type`, `status`, `page`, `per_page`
- **Permission**: Own requests OR all with `view all treasury requests`

#### `create(Request $request)`
Creates a new treasury request with line items.
- **Required**: `type`, `title`, `description`, `amount`, `request_date`
- **Optional**: `needed_by_date`, `division_id`, `items[]`
- **Items**: Each has `description`, `amount`, `category`

#### `update(Request $request)`
Updates existing request (only for draft, submitted, or rejected status).
- Syncs items if provided
- Resets status to `draft` if rejected request is edited

#### `submit(Request $request)`
Submits request for approval chain.
- Changes status from `draft` → `submitted`
- For rejected requests: clears old approvals, restarts workflow

#### `approve(Request $request)`
Two-level approval system:
1. **Leader** approves first → status becomes `under_review`
2. **Treasurer** approves → status becomes `approved`

#### `reject(Request $request)`
Immediate rejection by either leader or treasurer.
- **Required**: `notes` (rejection reason)
- Status becomes `rejected`

#### `stats(Request $request)`
Returns comprehensive statistics:
- Summary: income, expenses, balance, request counts
- Chart data: monthly income/expense from FinancialRecord + approved requests
- Category breakdowns for income and expenses
- Pending approval list

#### `uploadAttachment(Request $request)`
Single attachment per request.
- **Params**: `treasury_request_id`, `file`
- Max 10MB, allowed: jpg, png, pdf, doc, xlsx
- Auto-deletes old attachment if replacing

---

## Frontend (React + TypeScript)

### Page
| File | Path |
|------|------|
| `treasury-page.tsx` | `/resources/js/pages/treasury/` |

Main page with tabs: Financial Overview, My Requests, Pending Approvals

### Components

| Component | Purpose |
|-----------|---------|
| `financial-overview-tab.tsx` | Dashboard with stats cards, charts, recent transactions |
| `my-requests-tab.tsx` | User's own requests list |
| `pending-approvals-tab.tsx` | Requests awaiting user's approval |
| `create-request-dialog.tsx` | Create/edit request form with validation |
| `request-card.tsx` | Request card with status, actions |
| `request-detail-dialog.tsx` | Full request details view with attachment preview |
| `add-record-dialog.tsx` | Add financial record (treasurer only) |
| `reject-dialog.tsx` | Rejection notes input |

### API Helpers
| File | Functions |
|------|-----------|
| `list-treasury.ts` | `listTreasury()` |
| `get-treasury.ts` | `getTreasury()` |
| `create-treasury.ts` | `createTreasury()` |
| `update-treasury.ts` | `updateTreasury()` |
| `delete-treasury.ts` | `deleteTreasury()` |
| `submit-treasury.ts` | `submitTreasury()` |
| `approve-treasury.ts` | `approveTreasury()` |
| `stats-treasury.ts` | `getTreasuryStats()` |
| `upload-proof.ts` | `uploadTreasuryAttachment()`, `deleteTreasuryAttachment()` |

### TypeScript Types
```typescript
// Location: resources/js/types/treasury/treasury.ts

TreasuryRequest       // Main request with attachment fields
TreasuryRequestItem   // Line item
TreasuryRequestApproval // Approval record
TreasuryStats         // Statistics response
```

---

## Approval Workflow

```
┌─────────────┐     ┌───────────────┐     ┌────────────────┐     ┌──────────┐
│   Draft     │ ──▶ │   Submitted   │ ──▶ │  Under Review  │ ──▶ │ Approved │
└─────────────┘     └───────────────┘     └────────────────┘     └──────────┘
     User              User                Leader ✓              Treasurer ✓
   creates           submits              approves               approves
                          │                    │
                          │                    │
                          ▼                    ▼
                    ┌──────────┐         ┌──────────┐
                    │ Rejected │ ◀────── │ Rejected │
                    └──────────┘         └──────────┘
                    Leader rejects      Treasurer rejects
```

### Rejection → Resubmit Flow
1. Request rejected with notes
2. User sees rejection reason on card
3. User edits request (can change details, upload new proof)
4. User clicks "Resubmit" → old approvals cleared, process restarts

---

## Financial Overview Features

### Summary Cards
- **Total Income** - From FinancialRecord income entries
- **Total Expenses** - FinancialRecord expenses + approved request amounts
- **Current Balance** - Income minus Expenses

### Charts
1. **Monthly Cash Flow** - Bar chart showing income/expenses by month
2. **Income by Category** - Pie chart
3. **Expense by Category** - Pie chart (combines FinancialRecord + approved requests)

### Add Report
Treasurers can manually add income/expense records:
- Type: Income or Expense
- Title, description, amount
- Category selection
- Date

---

## Permissions Required

| Action | Permission |
|--------|------------|
| View own requests | (default) |
| View all requests | `view all treasury requests` |
| Approve as leader | `approve treasury requests` + `leader` role in division |
| Approve as treasurer | `approve treasury requests` + `treasurer` role |
| View financial overview | `view treasury reports` |
| Add financial records | `view treasury reports` (treasurer) |

---

## Form Validation (Create/Edit Dialog)

- **Title** - Required
- **Description** - Required
- **Amount** - Required, must be > 0
- **Category** - Required
- **Date** - Required

Features:
- Red borders and error messages on invalid fields
- Cancel confirmation if unsaved changes
- Submit confirmation before sending

---

## File Structure Summary

```
app/
├── Models/
│   ├── TreasuryRequest.php
│   ├── TreasuryRequestItem.php
│   ├── TreasuryRequestApproval.php
│   └── FinancialRecord.php
├── Http/Controllers/Api/
│   └── TreasuryController.php

database/migrations/
├── 2025_04_20_..._create_treasury_requests_table.php
├── 2025_04_24_..._create_treasury_request_items_table.php
├── 2025_12_23_..._create_treasury_request_approvals_table.php
└── 2025_12_24_..._create_financial_records_table.php

resources/js/
├── pages/treasury/
│   ├── treasury-page.tsx
│   └── components/
│       ├── add-record-dialog.tsx
│       ├── create-request-dialog.tsx
│       ├── financial-overview-tab.tsx
│       ├── my-requests-tab.tsx
│       ├── pending-approvals-tab.tsx
│       ├── reject-dialog.tsx
│       ├── request-card.tsx
│       └── request-detail-dialog.tsx
├── lib/api/treasury/
│   ├── list-treasury.ts
│   ├── get-treasury.ts
│   ├── create-treasury.ts
│   ├── update-treasury.ts
│   ├── delete-treasury.ts
│   ├── submit-treasury.ts
│   ├── approve-treasury.ts
│   ├── stats-treasury.ts
│   └── upload-proof.ts
└── types/treasury/
    └── treasury.ts

routes/
└── api.php (treasury routes at lines 130-151)
```
