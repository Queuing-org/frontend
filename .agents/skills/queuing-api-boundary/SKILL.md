---
name: queuing-api-boundary
description: Verify and implement queuing-org API clients, hooks, payloads, cache invalidation, and API/UI contract boundaries.
---

# Queuing API Boundary

## When to Use

Use this skill when a task touches:

- `src/entities/*/api/*`
- React Query hooks or mutation invalidation
- request payloads, response typing, headers, or `ApiResponse<T>` unwrapping
- room password, slug normalization, playlist queue, room update, friend, auth, user, or search endpoints
- troubleshooting involving HTTP status codes, API docs, or network logs

Do not use it for purely visual CSS changes with no data flow.

## Required Inputs

- endpoint path or API docs URL when available
- current client function, hook, and consuming UI files
- observed request/response, error log, or browser network evidence when troubleshooting
- expected cache updates and UI state after success or failure

## Workflow

1. Read the endpoint client, hook, type definitions, and consuming component together.
2. Compare API docs or observed response shape to `src/entities/*/model/types.ts`.
3. Check shared conventions:
   - use `axiosInstance`
   - unwrap `ApiResponse<T>` consistently
   - throw `ApiError` for failed `result` values
   - normalize room slugs with `normalizeRoomSlug`
   - include `X-Room-Password` only when a protected room request needs it
4. For mutations, list every query key that must be invalidated or optimistically updated.
5. For PATCH requests, send only fields with a clear user intent. Do not send UI-only fields or unknown existing secrets.
6. For troubleshooting, separate confirmed facts from hypotheses. A 500 is server failure behavior; client payload ambiguity should be documented as a defensive frontend fix, not overstated as the root cause unless reproduced.
7. Write `_workspace/01_api_contract.md` for large or risky changes.

## Project-Specific Rules

- Room update payloads should be partial: `title`, `tags`, and `password` only when changed or intentionally set.
- Empty password strings are ambiguous unless the API explicitly documents them as "clear password".
- Queue mutations must refresh `roomQueue`; changes that affect current playback or participants should also consider `roomState`.
- Playlist item operations use `entryId`, not track video id.
- Public room card images are currently frontend defaults. Do not assume the backend provides a representative image until the API adds it.

## Outputs

- updated API client, hook, types, or consuming component
- query invalidation notes
- `_workspace/01_api_contract.md` for complex work
- incident candidate when a reusable API failure is discovered

## Validation

- The request payload matches the user's actual intent.
- Response typing matches the consuming UI shape.
- Related query keys are invalidated or optimistically updated.
- Errors surface actionable messages without hiding server failures.
- `npm run lint` and `npm run build` pass for code changes unless the user explicitly skips them.
