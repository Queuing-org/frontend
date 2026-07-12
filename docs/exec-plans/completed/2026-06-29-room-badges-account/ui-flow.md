# UI Flow Notes

## Create Room

- `RoomFormModal` owns create form state and payload construction.
- `CreateSettingsStep` is presentational/controlled for:
  - max participants
  - per-track time limit
  - participation mode and password
- Max participants is digit-filtered text input and always shows "최대 250명" in red.
- Per-track time limit is a dropdown with "제한 없음" plus fixed minute options.
- Empty fields are omitted from the create payload.
- Invalid max-participant input blocks final submission and shows inline errors.

## Random Entry

- Desktop `HomeSearchControlDock` menu handles `RANDOM`.
- Home and search desktop controls share the same random entry hook, keeping the shared control behavior consistent.
- Mobile home quick actions include a random-entry icon button.
- Pending state disables only the random-entry action and shows loading UI.
- Random-entry errors render near the home/search control surface.

## Badge Settings

- Profile settings keep the existing "칭호" row in `ProfileSettingsForm`.
- The "개발중입니다" field is replaced with a dropdown.
- Acquired badges are sorted above unacquired badges.
- Acquired options are selectable and styled bold; unacquired options are disabled/gray.

## Room Badge Display

- Room profile panel fetches public profile and public badges when `currentRequester.slug` exists.
- Slug-less requesters do not render a badge card.
- Participant list dedupes user slugs and fetches public badges via `useQueries`; participant cards receive computed badge data only.
