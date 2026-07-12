# Queuing Documentation

This is the canonical index for durable project knowledge. `AGENTS.md` routes agents here; humans and agents share the same source of truth.

| Area | Canonical location | Use when |
| --- | --- | --- |
| Architecture | [`../ARCHITECTURE.md`](../ARCHITECTURE.md) | implementing, reviewing, or changing boundaries |
| Architecture decisions | [`architecture/decisions/`](architecture/decisions/) | recording a structural choice and its tradeoffs |
| Product behavior | [`product-specs/`](product-specs/) | behavior spans screens or is ambiguous from code |
| Execution plans | [`exec-plans/`](exec-plans/) | complex, resumed, or multi-step work |
| Reliability | [`RELIABILITY.md`](RELIABILITY.md) | WebSocket, cache consistency, retries, and failure recovery |
| Security | [`SECURITY.md`](SECURITY.md) | auth, CSRF, passwords, redirects, and sensitive data |
| Agent harness | [`agent-harness/`](agent-harness/) | routing, handoffs, QA roles, and reusable incidents |

Keep scratch portfolio notes in ignored `docs/portfolio-notes/`. Promote only durable project knowledge into the indexed locations above.
