# Technical Debt Tracker

Track known, accepted gaps with an observable exit condition. Do not use this file as a generic wishlist.

| Area | Debt | Evidence | Exit condition |
| --- | --- | --- | --- |
| Verification | The repository has lint and build checks but no automated unit, integration, or end-to-end test suite. | `package.json` exposes only `lint` and `build` verification scripts. | Add a test strategy, regression coverage for confirmed incidents, and a single CI verification command. |
| CI | Pull requests are not mechanically gated by repository workflows. | No tracked `.github/workflows/` files. | Add required CI checks for code and documentation validation. |
| Documentation | Cross-links and required document structure are not mechanically validated. | No docs validation script or CI job. | Add a deterministic docs checker for required paths, relative links, and plan metadata. |
