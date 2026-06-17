# Implementation Notes

## Structure

- Removed feature-owned code from `src/entities` and composed screens from `src/widgets`.
- Moved room, playlist, user, and follow API/type/query code under the consuming `src/features/*` owners.
- Moved home widget UI to `src/features/home/ui`.
- Moved room floating/control UI to `src/features/room/floating` and `src/features/room/control-bar`.
- Moved room and search route bodies into feature screens:
  - `src/features/room/page/ui/RoomPlaybackScreen.tsx`
  - `src/features/room/search/components/SearchScreen.tsx`
- Deleted dev/test surfaces:
  - `src/app/test/page.tsx`
  - `src/features/room/list/ui/RoomListTest.tsx`
  - `src/features/room/create/ui/CreateRoomTest.tsx`
  - entity demo UI files

## API And Cache

- Added shared helpers:
  - `unwrapApiResponse`
  - `assertApiBooleanResult`
  - `buildRoomPasswordHeaders`
  - `buildRoomPasswordSubscriptionHeaders`
- Added query key factories:
  - `roomKeys`
  - `playlistKeys`
  - `userKeys`
  - `followKeys`
- Replaced raw response unwraps and protected-room password header literals in feature API clients.
- Kept STOMP publish calls payload-only; password headers are used only on subscriptions.

## Feature Splits

- Add track:
  - `useAddTrackAction`
  - `useAddTrackForm`
  - `AddTrackButton`
  - `AddTrackModalView`
  - `AddTrackFormFields`
  - Removed the `reason` field because the API payload does not support it.
- Room update:
  - `useEditRoomForm`
  - `buildUpdateRoomPayload`
  - Removed unsupported `maxUsers` and `trackLimitMinutes` state/UI.
  - Changed password edit behavior to explicit "change password" semantics. Disabling the control keeps the existing password.
- Queue:
  - `useRoomQueuePanel`
  - `RoomQueuePanelView`
  - `RoomQueueListSection`
- Chat:
  - `CHAT_MAX_LENGTH`
  - `useChatComposerState`
  - `useChatScrollRestoration`
  - chat composer leaf components
  - chat realtime parser util
- Playback:
  - `useYouTubeIframePlayer`
  - `useRoomPlaybackViewModel`
  - `useRoomRealtimeEvents`
- Follow/settings:
  - `useFollowModalState`, `FollowUserSearch`, `FollowTabs`, `FollowTabPanel`
  - `useProfileSettingsForm`, `ProfileSettingsForm`, `ProfileStats`
  - Profile update now updates the React Query `me` cache instead of mirroring `savedNickname` locally.

## Known Tradeoffs

- `useRoomJoinSession` was not extracted because the current join state, chat setup, and realtime subscription dependencies form a tight cycle. Extracting only part of it would make the dependency graph worse. Realtime side effects and playback derivation were separated first.
- No Vitest suite was added because the repo currently has no test runner dependency or script. Verification used lint/build plus structural grep checks.
