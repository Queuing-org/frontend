# Feature Delivery Workflow

- status: complete
- started: 2026-07-12
- scope: agent harness, repo-local skills, pull request template, and CI

## Goal

Create a repeatable feature-delivery pipeline that routes implementation through the correct Queuing specialists, validates the result, publishes a draft pull request, and resumes later for CI or review feedback.

## Acceptance Criteria

- Feature, fix, and refactor delivery requests automatically select a repo-local delivery skill.
- The delivery skill creates a scoped branch and run, selects API/UI/QA skills, and publishes only after validation.
- A separate skill handles PR checks and actionable review feedback.
- PRs use a concise template with verification, boundary, and residual-risk evidence.
- GitHub Actions runs the repository's current lint and build gates.
- Merge, review submission, and thread resolution remain explicit user actions.

## Progress

- [x] inspect current harness, GitHub templates, and available publish/review skills
- [x] choose Pipeline + Producer-Reviewer architecture
- [x] implement delivery and review-cycle skills
- [x] add CI, PR template, AGENTS routing, and team-spec integration
- [x] validate skill structure, workflow syntax, links, and diff

## Decisions

- Keep feature delivery and PR review as separate skills because PR feedback is asynchronous.
- Use one implementation owner by default; invoke bounded specialists by changed boundary instead of parallel editing.
- Open draft PRs by default and never auto-merge.
- Treat explicit feature delivery as authorization for branch, commit, push, and draft PR creation, but stop on ambiguous mixed worktrees or missing authentication.

## Selected Skills

- `harness`: pipeline, roles, handoffs, and failure policy
- `skill-creator`: repo-local skill initialization, metadata, and validation shape

## Verification

- skill frontmatter, names, descriptions, TODO removal, and default prompts: pass
- workflow and skill metadata YAML parse: pass
- `git diff --check`: pass
- `npm run lint`: pass
- `npm run build`: pass

The bundled `quick_validate.py` could not start because the local Python environment lacks `PyYAML`; equivalent structural checks were run directly and passed.

## Residual Risk

- GitHub branch protection must still be configured in repository settings to require CI and human approval.
- CI currently enforces lint and build only because the repository has no automated test suite yet.
