# UI Prototype Spec — Integration Builder

## 1. Purpose

This document translates [PRD-integration-builder.md](/Users/Nilotpal.Prakash/Cursor/Personal/PRD-integration-builder.md) into a screen-by-screen UI prototype spec for v1.

Prototype goal:
- make the connector creation and management flow concrete enough to design and build
- validate the information architecture, state model, and user actions
- avoid backend-only details unless they directly affect UI behavior

## 2. Core UI model

- **App** = top-level SaaS product group, such as `HubSpot` or `Calendly`
- **Connector** = independent connection record under an app
- **Connection Name** = unique human-readable name within the app
- **Creation modes**:
  - `Start from scratch`
  - `Use existing template`
- **recordStatus**:
  - `draft`
  - `active`
- **availabilityStatus**:
  - `active`
  - `disabled`
  - `revoked`

## 3. Navigation model

- Entry gate before `Integrations`: `Sign in`
- Primary nav entry: `Integrations`
- Inside `Integrations`, user lands on an app-and-connector workspace
- Navigation structure:
  - `Login`
  - `Apps list`
  - `App detail`
  - `Connector detail`
  - creation flow as modal or full-page wizard

Prototype recommendation:
- use a 3-column desktop layout
  - left: app list
  - center: connectors under selected app
  - right: detail panel or action panel
- on mobile/tablet, collapse into stacked screens

## 4. Screen list

1. Integrations Home
2. Login
3. Idle Lock / Resume Session
4. Empty Landing Page
5. App Detail
6. Create Connector Modal
7. Scratch Warning Step
8. Template Warning Step
9. Scratch Docs Input
10. Parsed Spec Confirmation
11. Component Selection
12. Generated Output Review
13. Sandbox Test
14. Save Activation
15. Connector Detail
16. Reauthorize Flow
17. Disable Confirmation
18. Revoke Confirmation
19. Delete Confirmation

## 5. Screen specs

### 5.1 Integrations Home

Purpose:
- entry into the integrations feature
- choose an app
- understand current connector footprint at a glance

Main content:
- page title: `Integrations`
- search bar: `Search apps`
- app list/grid
- each app card shows:
  - app name
  - connector count
  - number active
  - number disabled
  - number revoked
  - quick action: `Open`

Empty state:
- title: `No apps yet`
- body: `Choose an app to start building or managing connectors.`

Primary actions:
- select app

### 5.2 Empty Landing Page

Purpose:
- first-run experience for a user who has access to Integrations but has not created any connectors yet

When to show:
- user is authenticated
- no connectors exist across all apps for the current workspace

Layout:
- hero-style centered onboarding state
- optional side illustration or product diagram

Main content:
- title: `Build your first connector`
- supporting copy: `Create a secure connector from API docs or start from an existing template. Test it before activation and manage it under the app it belongs to.`

Primary CTAs:
- `Start from Scratch`
- `Use Existing Template`

Secondary CTA:
- `Browse Apps`

Supporting explainer strip:
- `1. Choose an app`
- `2. Build from docs or start from a template`
- `3. Test and activate`

Optional helper section:
- `What is a connector?`
- short copy: `A connector is an independent integration record under an app, with its own credentials and status.`

Prototype note:
- this should feel like a confident product entry point, not a blank state with only one button

### 5.2 Login

Purpose:
- authenticate the user before they can access integrations

Prototype auth modes:
- `Continue with SSO`
- `Sign in with Email`

Layout:
- centered auth card on a branded background
- top-left or centered logo
- short supporting copy: `Sign in to manage apps, connectors, and credentials securely.`

Fields for email/password mode:
- `Work Email`
- `Password`

Primary actions:
- `Continue with SSO`
- `Sign In`

Secondary actions:
- `Use Email Instead`
- `Back to SSO`
- `Forgot Password`

Validation:
- email required
- password required for email mode

Error states:
- invalid credentials
- expired session
- SSO unavailable

Success result:
- route user into `Integrations Home`

Prototype note:
- login should feel enterprise and secure, not consumer-style
- keep it simple; do not add signup in this flow

### 5.3 Idle Lock / Resume Session

Purpose:
- handle session timeout without fully signing the user out

Trigger:
- session idles or app triggers lock

Layout:
- modal overlay above current screen
- background remains visible but blurred/dimmed

Content:
- title: `Session Locked`
- body: `Your session was locked due to inactivity. Resume to continue managing connectors.`
- last sign-in method badge:
  - `SSO`
  - `Email`

Actions:
- if SSO session still valid:
  - `Resume Session`
- if password auth:
  - `Enter Password`
- fallback:
  - `Sign Out`

Result:
- restore previous screen context on success

Prototype rule:
- idle lock is different from sign-out
- a locked session should not discard in-progress draft UI state

### 5.5 App Detail

Purpose:
- show all connectors under one app
- let user open existing connectors or create a new one

Header:
- breadcrumb: `Integrations / {App Name}`
- title: app name
- subtitle: short app summary if available
- primary CTA: `New Connector`

Main content:
- connector table or cards
- columns:
  - `Connection Name`
  - `Auth Type`
  - `Record Status`
  - `Availability`
  - `Last Updated`
  - `Actions`

Row actions:
- `Open`
- `Disable` when active
- `Enable` when disabled
- `Reauthorize` when revoked
- `Revoke`
- `Delete` only when revoked

States:
- if no connectors:
  - title: `No connectors for this app`
  - actions:
    - `Start from Scratch`
    - `Use Existing Template`

### 5.6 Create Connector Modal

Purpose:
- choose how to create a connector

Fields:
- `Connection Name`
- creation mode cards:
  - `Start from Scratch`
  - `Use Existing Template`

Validation:
- connection name required
- connection name must be unique within current app

Footer actions:
- `Cancel`
- `Continue`

Button rules:
- `Continue` disabled until valid connection name and mode selected

### 5.7 Scratch Warning Step

Purpose:
- force explicit acknowledgment before docs-driven generation

Content:
- title: `Before You Start`
- warning copy: `Generated behavior depends on the quality and completeness of the documentation you provide.`

Controls:
- checkbox: `I understand the generated connector depends on the provided docs`
- buttons:
  - `Back`
  - `Continue`

### 5.8 Template Warning Step

Purpose:
- force explicit acknowledgment before template-based creation

Content:
- title: `Template Warning`
- warning copy: `Templates may not reflect the latest API documentation unless refreshed later from docs.`

Controls:
- checkbox: `I understand this template may use older API assumptions`
- buttons:
  - `Back`
  - `Continue`

### 5.9 Scratch Docs Input

Purpose:
- collect docs source for scratch flow

Fields:
- `Documentation URL`
- advanced toggle: `Model Selection`

Advanced section:
- visible only when toggled
- fields:
  - `Parsing Model`
  - `Generation Model`

Default behavior:
- advanced section collapsed by default
- template flow never shows model selection in v1

Actions:
- `Back`
- `Parse Docs`

Loading state:
- progress area with steps:
  - `Fetching docs`
  - `Detecting machine-readable spec`
  - `Normalizing parsed spec`

### 5.10 Parsed Spec Confirmation

Purpose:
- confirm the highest-leverage gate before generation

Summary cards:
- endpoint count
- auth type
- pagination style
- rate-limit behavior
- base URL

Endpoint preview:
- searchable list
- fields shown:
  - method
  - path
  - operation type

Actions:
- `Re-crawl`
- `Confirm Parsed Spec`
- `Back`

Button rules:
- generation flow cannot continue until user confirms

### 5.11 Component Selection

Purpose:
- choose what to generate

Checklist:
- `API Client`
- `Auth Setup`
- `Users + Usage Data`
- `Error Handling`
- `Pagination`
- `Logging`

System behavior:
- dependent selections auto-check prerequisites
- disabled hint text explains why a dependency was included

Auxiliary UI:
- right-side summary:
  - selected components count
  - dependencies added
  - creation mode

Actions:
- `Back`
- `Generate Connector`

### 5.12 Generated Output Review

Purpose:
- review generated code artifacts before testing

Layout:
- left: file tree
- right: code tabs or viewer

Secondary information:
- generation summary
- static analysis result

Static analysis states:
- `Passed`
- `Failed`

If failed:
- show findings panel
- block test/save continuation
- show CTA: `Regenerate`

Actions:
- `Regenerate`
- `Continue to Test`
- `Back`

### 5.13 Sandbox Test

Purpose:
- test connector server-side before activation

Layout:
- top: credential section
- left: endpoint list
- center: request form generated from Parsed Spec
- right: structured response panel

Credential section:
- auth type badge
- fields based on auth model
- note: `Credentials are stored server-side and are never sent to the model`

Request section:
- schema-driven form
- raw/advanced toggle

Response section:
- success/failure status
- structured response view
- response time
- rate-limit info if returned

Actions:
- `Run Test`
- `Save Connector`
- `Back`

Button rules:
- `Save Connector` disabled until at least one test succeeds

### 5.14 Save Activation

Purpose:
- finalize draft connector into active connector

Modal content:
- title: `Save Connector`
- summary:
  - connection name
  - creation mode
  - auth type
  - test status

Copy:
- `Saving will activate this connector for use.`

Actions:
- `Cancel`
- `Save and Activate`

Result:
- connector moves to:
  - `recordStatus=active`
  - `availabilityStatus=active`

### 5.15 Connector Detail

Purpose:
- manage one existing connector

Header:
- breadcrumb: `Integrations / {App Name} / {Connection Name}`
- status badges:
  - recordStatus
  - availabilityStatus

Sections:
- overview
- auth summary
- source summary
- generated components
- latest successful test
- action panel

Action panel:
- `Test`
- `Edit / Regenerate`
- `Disable` or `Enable`
- `Revoke`
- `Delete` only if revoked
- `Refresh from Docs` optional entry point for future prototype view

Behavior by availability:
- active:
  - test allowed
  - disable allowed
  - revoke allowed
- disabled:
  - enable allowed
  - revoke allowed
- revoked:
  - test blocked
  - enable blocked
  - reauthorize allowed
  - delete allowed

### 5.16 Reauthorize Flow

Purpose:
- restore a revoked connector

Content:
- title: `Reauthorize Connector`
- body: `Revoked connectors require new credentials before they can be used again.`
- credential input form

Rules:
- overwrites existing credential binding for that connector

Actions:
- `Cancel`
- `Save Credentials`

Result:
- `availabilityStatus=active`

### 5.17 Disable Confirmation

Purpose:
- temporarily make connector unavailable

Copy:
- `Disabled connectors cannot be used until re-enabled. Stored credentials will be preserved.`

Actions:
- `Cancel`
- `Disable Connector`

### 5.18 Revoke Confirmation

Purpose:
- stronger offboarding action

Copy:
- `Revoking this connector will make it unavailable and delete its stored credentials. Reauthorization will be required before reuse.`

Actions:
- `Cancel`
- `Revoke Connector`

Result:
- `availabilityStatus=revoked`

### 5.19 Delete Confirmation

Purpose:
- hard delete

Eligibility:
- only visible when connector is already revoked

Copy:
- `Deleting permanently removes this connector from the application database. This action cannot be undone.`

Actions:
- `Cancel`
- `Delete Permanently`

## 6. Button and state rules

- user must be authenticated to enter `Integrations`
- if the workspace has no connectors yet, show `Empty Landing Page` before standard app-first browsing
- idle lock can appear on top of any authenticated screen
- `Continue` in create flow requires valid connection name
- `Parse Docs` only visible in scratch flow
- `Confirm Parsed Spec` required before generation
- `Continue to Test` blocked if static analysis fails
- `Save Connector` blocked until at least one successful sandbox test
- `Delete` hidden unless connector is revoked
- `Reauthorize` visible only for revoked connectors
- `Enable` visible only for disabled connectors
- `Disable` visible only for active connectors

## 7. Status badge system

Record status:
- `Draft` = neutral badge
- `Active` = solid success badge

Availability status:
- `Active` = green
- `Disabled` = amber
- `Revoked` = red

Prototype note:
- never show only one status badge when both matter
- always display both together on connector detail

## 8. Prototype copy set

Suggested primary CTA labels:
- `Continue with SSO`
- `Sign In`
- `Resume Session`
- `New Connector`
- `Start from Scratch`
- `Use Existing Template`
- `Parse Docs`
- `Confirm Parsed Spec`
- `Generate Connector`
- `Run Test`
- `Save and Activate`
- `Disable Connector`
- `Revoke Connector`
- `Delete Permanently`
- `Reauthorize`

## 9. Recommended prototype scope

For a clickable v1 prototype, build these screens first:

1. Integrations Home
2. Login
3. Idle Lock / Resume Session
4. Empty Landing Page
5. App Detail
6. Create Connector Modal
7. Scratch Warning Step
8. Template Warning Step
9. Scratch Docs Input
10. Parsed Spec Confirmation
11. Component Selection
12. Generated Output Review
13. Sandbox Test
14. Connector Detail
15. Disable/Revoke/Delete/Reauthorize modals

## 10. Open UI questions

- Should connector list default to cards or table on desktop?
- Should login default to SSO first with email hidden behind a secondary action, or should both methods be visible immediately?
- Should `Use existing template` show templates inline in the create modal or on a dedicated picker screen?
- Should generated code review and sandbox test be separate screens or a split view in one workspace?
- Should disabled connectors remain visible in the default list filter or move under a secondary filter?
