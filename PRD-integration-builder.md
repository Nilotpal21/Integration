# PRD — AI-Generated Integration Builder

> **How to use this doc (for Claude Code):** This is the source of truth for the build. Requirements are
> numbered (`FR-*`, `NFR-*`, `SAFE-*`) so you can reference them in commits/PRs. Treat everything under
> **§8 Safety boundary** as hard constraints that override convenience. Build to **§11 Phase 1 (v1)** first;
> do not implement fast-follow/later items unless asked. When a decision is ambiguous, prefer the option
> that keeps the model emitting *data/artifacts only* and your trusted code doing all rendering/execution.

---

## 1. Summary

A feature inside the product's **Integrations** tab that lets a user generate a working connector with a
SaaS application from its API documentation. One app can have **multiple connectors** (for example by auth
method, API version, region, or use case). The user selects an app, then either opens an existing connector,
starts from scratch, or creates a new connector from an existing template. Connectors are grouped under their
parent app and are independent of one another. Scratch creation uses docs ingestion, parsed-spec confirmation,
generation, and sandbox testing. Template creation starts from an existing vetted baseline and skips model
selection unless the user later refreshes it from docs.

## 2. Problem & goals

- **Problem:** Integrating with SaaS apps requires engineering work because each app has its own API, auth model,
  rate limits, and data shapes. This does not scale across hundreds of apps.
- **Goal:** Let a non-deep-engineering user produce a correct, safe connector from docs, validated before it
  touches production.
- **Success metrics (suggested):** % of generated integrations that pass sandbox on first try; time from
  "select app" to "active connector"; % of requests served from templates vs fresh generation; # breaking
  changes auto-detected before they break prod.

### Non-goals (v1)
- Write/mutating operations against third-party APIs (read-only only in v1 — see `SAFE-9`).
- Full OAuth authorization-code flow (v1 uses API keys / personal access tokens — see `FR-12`).
- GraphQL, webhook/event ingestion, and APIs with no machine-readable or scrapable spec (see §12).
- Letting the model generate or author the UI (explicitly forbidden — `SAFE-1`).

## 3. Primary user & flow

**User:** a customer admin/operator setting up an integration; assume light technical literacy, not a backend engineer.

**Finalised flow (implement in this order):**
1. Integration tab → select app.
2. Show existing connectors for that app, if any. User chooses one of: open an existing connector, start from
   scratch, or use an existing template.
3. When creating a connector, require a connection name that is unique within that app.
4. Show warnings on both creation paths:
   - Start from scratch: generated behavior depends on the quality and completeness of the documentation.
   - Use existing template: the template may not reflect the latest API docs unless refreshed later.
5. If the user chooses **Start from scratch**, collect the documentation URL.
6. **Confirm parsed spec** — system crawls + parses, then shows a summary ("14 endpoints, OAuth 2.0, cursor
   pagination") for the user to confirm or re-crawl. *Highest-leverage gate.*
7. Select which components to generate (checklist).
8. Generate code.
9. Test in sandbox (credentials entered here).
10. Save connector config — **unlocked only by a passing sandbox test**. Save makes the connector active.

## 4. Functional requirements

### 4.1 Documentation ingestion
- **FR-0** Connector creation supports two modes:
  - **Start from scratch** — docs-driven parsing + generation.
  - **Use existing template** — create a new independent connector from a vetted template baseline.
- **FR-1** Server-side crawler ingests a docs URL (not browser-based). Handles JS-rendered pages, follows the
  nav tree, dedupes.
- **FR-2** Prefer a machine-readable source when present (OpenAPI/Swagger/Postman collection). Fall back to LLM
  extraction from rendered HTML only when none exists.
- **FR-3** Normalize all sources into a single **Parsed Spec** object (see §5). This is the single source of truth.
- **FR-4** Cache the Parsed Spec keyed by app+connection name+URL+spec version so regenerating a single component
  does not re-crawl.
- **FR-5** Present a confirmation screen summarizing endpoints, auth model, pagination style, and rate-limit info.
  User can confirm or trigger re-crawl.
- **FR-5a** The system data model must support **one app to many connectors**. A generated connector is saved as
  a connector record under an app, not as the app itself.
- **FR-5b** Each connector must have a **connection name unique within its app**.
- **FR-5c** `Start from scratch` must show a warning that output quality depends on the quality and completeness of
  the docs.
- **FR-5d** `Use existing template` must show a warning that the template may not reflect the latest API docs unless
  refreshed from docs later.
- *Acceptance:* given a docs URL with an OpenAPI spec, the system produces a Parsed Spec whose endpoint count and
  auth type match the source, within the confirmation screen, without generating any code yet.

### 4.2 Component selection & generation
- **FR-6** User selects any subset of: API client, Auth setup, Users + usage data, Error handling, Pagination, Logging.
- **FR-7** Generation is **per-component but composing into one coherent codebase**. Selecting a dependent
  component pulls in its dependencies (e.g. "Users + usage data" pulls in client + auth).
- **FR-8** A single component can be regenerated/retried independently without redoing the whole set.
- **FR-9** Generated code must: never embed secrets (reference by env var / vault key); request read-only scopes
  by default; include 429/rate-limit handling with backoff; use structured logging that never logs secrets/tokens;
  include pagination handling where the spec describes it.
- **FR-10** Generation builds on **vetted client scaffolds/templates** where they exist; the model fills
  app-specific glue, not the whole file from scratch.
- **FR-10a** Template-based creation makes a new independent connector record. It does not share credentials or live
  runtime state with the template source.
- *Acceptance:* generated output is a set of files forming one runnable codebase; static analysis (`SAFE-5`) passes;
  no hard-coded credentials present.

### 4.3 Auth
- **FR-11** Credentials are collected **at test time** (first point they're genuinely needed), not as a separate
  earlier step.
- **FR-12** v1 supports API keys / personal access tokens (pasteable). Full OAuth "Connect" flow is fast-follow.
- **FR-12a** In v1, **each connector has one primary auth strategy**. If an app supports multiple auth methods
  (for example API key and OAuth), model those as separate connectors unless a later phase adds runtime auth
  switching within a single connector.
- **FR-13** Credentials are sent to the backend and used server-side; never held in the browser, never sent to the
  model, never written into generated code.
- **FR-14** Each connector has exactly **one credential set** in v1. Store that credential set in the vault and bind
  it to the connector record.
- **FR-14a** Disabling a connector does not delete its credential set. Re-enabling the connector makes the same
  stored credential usable again.
- **FR-14b** Revoking a connector deletes its credential set from the vault.
- **FR-14c** Reauthorizing a revoked connector overwrites the same connector's credential binding.
- **FR-15** Default test credentials to read-only scopes.

### 4.4 Connector lifecycle
- **FR-15a** Connector state is represented by two fields:
  - `recordStatus`: `draft | active`
  - `availabilityStatus`: `active | disabled | revoked`
- **FR-15b** A connector starts as `recordStatus=draft`.
- **FR-15c** A connector becomes `recordStatus=active` only after a successful sandbox test and an explicit save.
- **FR-15d** A connector can be **disabled**. Disabled connectors remain stored and keep their credential set, but
  are unavailable for use until re-enabled.
- **FR-15e** A connector can be **revoked**. Revocation disables use and requires reauthorization before the
  connector can return to `availabilityStatus=active`.
- **FR-15f** Regeneration must not overwrite the live connector immediately. The system stages regenerated output in
  the editor/test flow and only replaces the connector definition after explicit user save.
- **FR-15g** A connector can be **deleted** only after it has been revoked. Deletion is a hard delete from the
  application database.
- **FR-15h** The UI must not allow hard delete of an active connector.
- **FR-15i** State-changing actions must show an irreversible-action warning before the user confirms, because v1 has
  no rollback and no version restore.

### 4.5 Testing (Postman-style sandbox)
- **FR-16** In-app tester lets the user invoke generated endpoints. Calls execute **server-side** (avoids CORS),
  read-only, with vault-injected credentials.
- **FR-17** The tester *is* the sandbox. A successful sandbox call is the gate that unlocks save.
- **FR-18** There is no separate deployment flow in v1. Saving the tested connector config makes the connector active.
- *Acceptance:* save control is disabled until at least one valid sandbox call succeeds; attempting to activate a
  connector before that is impossible via the UI and the API.

### 4.6 UI rendering
- **FR-19** Request UI is **schema-driven forms**, generated deterministically from the Parsed Spec types:
  string→text, enum→dropdown, boolean→toggle, integer→number, date→date picker, array→repeatable rows,
  object→collapsible sub-form. Required fields validated; doc descriptions become helper text.
- **FR-20** Responses rendered as structured views (labeled fields/tables; a chart for usage data where it fits),
  not raw JSON, when the response schema is known.
- **FR-21** Every form has a **raw/advanced toggle** for cases forms cannot express (nested/polymorphic bodies,
  file uploads, arbitrary headers).
- **FR-22** Graceful per-field fallback: when a field's type can't be determined, render a plain text input rather
  than a broken control. The form degrades field-by-field, not all-or-nothing.
- **FR-23** Generated code display is a file tree / tabs rendered from the files array.

## 5. Data model — the Parsed Spec (single source of truth)

The form, the generated client code, and the response views **must all render from the same Parsed Spec**. If two
surfaces read different representations they drift, producing "test passed but code is wrong" bugs.

Suggested shape (adapt as needed):

```jsonc
{
  "connectorId": "calendly-core-readonly-v1",
  "appId": "calendly",
  "app": "Calendly",
  "connectionName": "Calendly Core Read-only",
  "sourceUrl": "https://developer.calendly.com/api-docs",
  "specVersion": "<hash or version>",          // cache key
  "baseUrl": "https://api.calendly.com",
  "auth": {
    "type": "oauth2 | api_key | pat | hmac",
    "scopes": ["read"],
    "tokenLocation": "header",
    "headerName": "Authorization",
    "scheme": "Bearer"
  },
  "pagination": { "style": "cursor | page | offset", "cursorField": "next_page_token" },
  "rateLimit": { "status": 429, "retryAfterHeader": "Retry-After" },
  "endpoints": [
    {
      "id": "list_org_memberships",
      "method": "GET",
      "path": "/organization_memberships",
      "operation": "read",                       // read | write  (write gated, SAFE-9)
      "params": [
        { "name": "organization", "in": "query", "type": "string", "required": true, "description": "..." },
        { "name": "count", "in": "query", "type": "integer", "required": false }
      ],
      "requestBodySchema": null,
      "responseSchema": { /* JSON-schema-like */ }
    }
  ]
}
```

Notes:
- `app` is the SaaS product identity.
- `connectorId` identifies a specific connector variant for that app.
- `connectionName` is user-facing and must be unique within the app.
- Multiple connectors may exist under one app, for example by auth type, API version, feature domain, or customer-specific customization.
- In v1, each connector maps to one primary auth strategy; alternate auth methods for the same app should be
  represented as separate connectors.
- Each connector has one credential set in v1.
- Template-based connectors must carry a stored Parsed Spec snapshot from the template baseline unless refreshed from
  current docs later.

## 6. Architecture (suggested, illustrative)

- **Crawler service** — server-side fetch + render, nav-tree traversal, spec detection, dedupe → raw docs.
- **Parser** — raw docs → Parsed Spec (prefer machine-readable; LLM extraction fallback). Validates + caches.
- **Generation service** — Parsed Spec + selected components → files. Wraps model calls; enforces scaffolds and
  generation constraints (`FR-9`, `FR-10`). Emits structured static-analysis report.
- **Sandbox executor** — isolated, ephemeral, network-egress-restricted container; only the target API's domains
  on the allowlist. Runs generated code / proxies test calls server-side with vault-injected creds.
- **Vault** — credential storage; code references by key only.
- **Connector registry** — the set of connector records grouped under each app. Library structure is
  `App -> Connector[]`, not a 1:1 app-to-connector mapping.
- **Template library** — existing vetted templates that can be used as a baseline for creating a new independent
  connector.
- **Frontend** — renders Parsed Spec → forms (FR-19..23); never executes model output.

## 7. Non-functional requirements

- **NFR-1** Cost levers built in from day one: prompt caching (cache the Parsed Spec across component
  regenerations) and Batch API for non-interactive generation.
- **NFR-2** Regenerating one component must reuse the cached spec (no re-crawl) and complete fast enough for an
  interactive loop.
- **NFR-3** Full audit log: who generated, who changed, who revoked, who deleted, and what scopes/credentials state
  changed.
- **NFR-3b** Revocation and deletion events must be audited with actor, timestamp, and connector identity.
- **NFR-3c** Audit/event records must survive connector hard deletion even though the connector record itself is
  removed from the application database.
- **NFR-4** Treat ingested docs as **untrusted input** throughout (prompt-injection risk).

## 8. Safety boundary (HARD CONSTRAINTS — override convenience)

- **SAFE-1** The model emits **data and artifacts only** — the Parsed Spec and the integration code. Trusted app
  code renders all UI deterministically from the spec. **The model never produces UI markup that is rendered or
  executed.** Forms-as-data, not forms-as-LLM-output.
- **SAFE-2** Sandbox-first, enforced by the product: production is **technically locked** until tests pass. Not an
  optional checkbox.
- **SAFE-3** No secrets in generated code; credentials injected at runtime from the vault by key.
- **SAFE-4** Read-only scopes by default for both generated code and test credentials.
- **SAFE-4a** A disabled connector must not execute until re-enabled.
- **SAFE-4b** A revoked connector must not be executable through the UI or API.
- **SAFE-5** Static analysis on every generation: secret scanning, dependency CVE checks, deny-list for dangerous
  calls (eval, shell exec, disk writes, non-allowlisted egress). Failing analysis blocks save.
- **SAFE-6** Execution only in isolated, ephemeral containers with network egress limited to the target API's
  allowlisted domains.
- **SAFE-7** Runtime blast-radius limits: rate caps, kill switch, idempotency on writes, circuit breakers; new
  connectors start in monitored/low-quota mode.
- **SAFE-9** Read vs write are different risk tiers. Writes require stricter review, dry-run, and idempotency —
  **out of scope for v1.**
- **SAFE-10** Treat ingested docs as untrusted (prompt-injection) — a docs page must not be able to influence
  scopes, egress allowlist, or UI.

## 9. Model strategy

Model selection applies only to **Start from scratch**. Template-based creation does not expose model selection in
v1 because it does not require fresh parsing/generation unless the user later refreshes the connector from docs.

- **Scratch flow model policy:** model selection is a quiet intelligent default with optional advanced override.
- **Default workhorse:** Claude Sonnet 4.6 — strong coding; 1M-token context at standard pricing, which matters
  for large API docs.
- **Escalation:** Claude Opus 4.8 — used on retry when Sonnet output fails sandbox/static analysis.
- **Cheap pre-processing:** Claude Haiku 4.5 — doc parsing, auth-type classification, endpoint extraction before
  the expensive model writes code.

> Verify current model IDs/pricing against the Claude API models overview before pinning a model in code, as these
> change.

## 10. Lifecycle (the platform play, not just day one)

- **API drift:** re-crawl docs on a schedule, diff the new spec against the one a scratch-built connector was generated from,
  flag breaking changes, and prompt the user to regenerate affected components.
- **Template library:** vetted templates can be reused as a baseline for new independent connectors. Template reuse
  improves speed, but template-based connectors may drift from current docs until refreshed.

## 11. Phasing

### Phase 1 — v1 (build this first)
- REST APIs with a machine-readable spec (OpenAPI/Swagger/Postman). LLM-extraction fallback for HTML docs.
- Flow:
  - Start from scratch: select app → create connector → docs URL → **confirm parsed spec** → select components →
    generate → test (enter API key/PAT) → save.
  - Use existing template: select app → create connector from template → review/edit → test (enter API key/PAT) →
    save.
- Components: all six (FR-6), read-only.
- Auth model: one primary auth strategy per connector in v1.
- Connector model: multiple independent connectors per app, unique connection name per app, one credential set per connector.
- Lifecycle model: `recordStatus=draft|active`, `availabilityStatus=active|disabled|revoked`, revoke first, then hard delete.
- Schema-driven form tester (FR-19..23) with raw toggle; server-side sandbox execution.
- Safety boundary §8 in full.
- Model selection only in scratch flow; static analysis gating; vault for creds.

### Phase 2 — fast-follow
- Full OAuth "Connect" flow (authorization-code/PKCE) in the tester.
- Opus 4.8 auto-escalation on retry; prompt caching + Batch API cost levers.
- API-drift re-crawl + diff + regenerate prompts.

### Phase 3 — later
- Write/mutating operations behind the stricter write-tier safeguards (SAFE-9).
- Webhook/event-based usage data; GraphQL; APIs with no clean spec.

## 12. Open questions
- **Ingestion scope for v1:** confirm "REST + machine-readable spec" as the v1 boundary. Usage data often arrives
  via webhooks/events, not REST polling; some APIs are GraphQL or have no clean spec — materially harder, deferred.

## 13. Glossary
- **Parsed Spec** — normalized representation of an app's API derived from its docs; the single source of truth.
- **Component** — a selectable generated piece (client, auth, data, errors, pagination, logging).
- **Sandbox** — server-side, read-only, egress-restricted execution environment; the in-app tester runs here.
- **App** — the SaaS product identity, such as HubSpot or Calendly.
- **Connector** — a specific integration variant under an app, for example differing by auth type, API version,
  region, use case, or customer-specific customization. Each connector has one credential set in v1 and is tracked
  by `recordStatus` and `availabilityStatus`.
- **Template** — a vetted baseline connector definition that can be copied to create a new independent connector.
- **Connection Name** — the user-facing name of a connector. It must be unique within an app.
- **Disable** — makes a connector temporarily unavailable while preserving credentials.
- **Revoke** — makes a connector unavailable and deletes its stored credential, requiring reauthorization before reuse.
- **Delete** — a hard delete from the database. Only allowed after revoke.
