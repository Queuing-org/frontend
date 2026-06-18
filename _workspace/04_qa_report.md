# QA Report

Result: pass with residual risk.

## Automated Verification

- `npm run lint`: pass with the pre-existing warning in `src/features/onboarding/ui/OnboardingWizard.tsx` for unused `setStep`.
- `npm run build`: pass.
- `git diff --check`: pass.
- `curl -skI https://local.queuing.patulus.com:3000/home`: `200 OK`.
- `curl -skI https://local.queuing.patulus.com:3000/search`: `200 OK`.

## Boundary Checks

- Thumbnail upload uses `PUT /api/v1/rooms/{slug}/thumbnail`.
- Multipart body uses field name `file`.
- Upload success invalidates `roomKeys.all()` and `roomKeys.meta(slug)`.
- Create room flow creates first, uploads thumbnail second, then navigates.
- Create-upload failure attempts to delete the just-created room and does not navigate to it.
- Edit room flow sends PATCH only for changed room fields and PUT only when a new thumbnail file is selected.
- File validation checks allowed extension and 6MB max size.
- Object URL previews are revoked on replacement, clear, and unmount.
- Home stage, mobile home, search selected image, and room background prefer `thumbnailUrl` and fallback to default images.
- `next.config.ts` allows `https://imagedelivery.net/**`.

## Parallel Review

- Subagent review reported no blocking findings.
- One previous residual UX risk was that changing title/tags after create succeeded but thumbnail upload failed would not affect the already-created room. Current behavior avoids that state by rolling back the created room on thumbnail-upload failure.

## Residual Risk

- Browser visual QA could not run because no in-app browser backend was available (`agent.browsers.list()` returned `[]`).
- The existing Next dev server on port 3000 was used for HTTP smoke checks. Starting a second server on port 3001 failed because `.next/dev/lock` was held by the existing server.
- The upload response is typed as `ApiResponse<boolean>` to match the existing boolean mutation pattern. If the backend returns a richer thumbnail payload, the type should be updated.
- CDN/image 404 at runtime is not swapped to the default image; fallback only covers missing `thumbnailUrl`.
