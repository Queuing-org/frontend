---
name: queuing-qa-reviewer
description: Review queuing-org changes by checking API/UI/cache/state boundaries, verification commands, and reusable failure evidence.
---

# Queuing QA Reviewer

## When to Use

Use this skill before final handoff when changes touch:

- API clients, hooks, or mutation invalidation
- room create/update/delete/join behavior
- playlist queue add/move/delete/playback behavior
- shared home/search controls
- floating room panels, modal state, or drag-and-drop interactions
- incident or troubleshooting documentation

Do not use it as a vague second implementation pass. QA must compare concrete boundaries.

## Required Inputs

- original user request
- changed files or diff
- relevant endpoint docs or observed network evidence
- expected verification commands
- any `_workspace/` artifacts created during implementation

## Workflow

1. Read the original request and changed files together.
2. Check boundary coherence:
   - API payload vs API docs or observed request
   - API response vs types and consuming components
   - mutation success vs invalidated query keys
   - route/component state vs user-visible workflow
   - websocket events vs local cache or room state assumptions
   - CSS interaction state vs DOM structure
3. Run or inspect verification:
   - `npm run lint`
   - `npm run build`
   - targeted manual/API checks when required and possible
4. Classify result as:
   - `pass`: no blocking issue
   - `fix`: targeted issue is cheaper than redo
   - `redo`: implementation direction conflicts with the request or contract
5. Write `_workspace/04_qa_report.md` for high-risk or multi-step changes.

## Outputs

- blocking findings with file references
- verification summary
- residual risk notes
- optional `_workspace/04_qa_report.md`

## Validation Checklist

- The final UI behavior matches the newest user request, not an older request.
- Every API mutation has a deliberate success/error/cache path.
- Any claim about a 500 or backend root cause is backed by reproducible evidence.
- Shared controls still behave consistently across home and search.
- Hover-only controls remain reachable by focus where practical.
- Build/lint results are reported honestly, including pre-existing warnings.
