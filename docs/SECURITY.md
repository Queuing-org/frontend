# Security

## Authentication And Session

- Use the shared Axios instance and existing session hooks rather than creating parallel authentication state.
- Clear user-owned query caches deliberately on logout or account withdrawal.
- Do not expose tokens, cookies, room passwords, or secret headers in logs, fixtures, screenshots, or durable docs.

## Request Protection

- Preserve the existing CSRF bootstrap and `X-XSRF-TOKEN` handling.
- Retry CSRF failures only under the bounded conditions implemented by the shared API layer; do not retry generic `401` or `403` responses blindly.
- Include `X-Room-Password` only for requests that require access to a protected room.
- Never send an empty room password to mean “keep the existing password” unless the backend contract explicitly supports it.

## Navigation And Input

- Validate internal redirect targets with the shared safe-path helper.
- Treat server errors and response text as untrusted input when rendering user-visible messages.
- Keep sensitive values scoped to the smallest component or request boundary that needs them.

Security-sensitive changes require explicit failure-path review and must not be approved from lint/build success alone.
