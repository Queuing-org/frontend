# Change Summary

- Added create-room `maxParticipants` digit-only input with red 250 max hint and `trackLimitMinutes` fixed dropdown.
- Added random room entry API/hook/navigation and wired it to desktop home/search controls plus mobile home quick action.
- Added badge API/query/type/helper layer, existing-row settings badge dropdown, room profile badge display, and participant badge display.
- Added public user profile fetch with `representativeBadge`.
- Added account withdrawal API/hook/UI with confirmation and cache cleanup.
- Added conservative CSRF refresh and one-time request retry in `axiosInstance`.

Verification:

- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
