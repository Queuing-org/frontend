# Room Self Participant Menu

## Scope

- 현재 로그인 사용자를 참가자 목록 첫 행으로 안정 정렬한다.
- 내 닉네임 오른쪽, 방장 왕관 왼쪽에 `(나)`를 표시한다.
- 내 참가자 행의 더보기 메뉴에서 기존 Settings/Friends modal을 연다.

## Acceptance Criteria

- 정렬은 query data를 변경하지 않고 나머지 참가자 순서를 보존한다.
- `(나)`는 `#3c3c3c`이며 방장 행은 `닉네임 → (나) → 왕관` 순서다.
- 내 행 메뉴는 `Setting`, `Friends`만 표시하고 hover, focus, Escape, outside-click 동작은 기존 참가자 메뉴와 같다.
- 데스크톱 draggable panel과 모바일 참가자 탭 모두 같은 modal owner를 사용한다.
- 다른 참가자의 관리 액션과 참가자 DOM 상한은 회귀하지 않는다.

## Decisions

- 사용자가 선택한 대로 내 행은 첫 번째 정렬만 적용하고 scroll sticky는 적용하지 않는다.
- 현재 사용자는 `currentUser.slug`와 participant `userSlug`로 판별한다.
- modal visibility는 `RoomPlaybackJoinedContent`의 local state가 소유한다.
- 실제 `SettingsModal`, `FollowModal`은 draggable transform 밖에 렌더링한다.
- 비로그인 guest에는 자기 표시와 로그인 전용 메뉴를 추가하지 않는다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Commit Plan

1. `feat(room): 참가자 목록에 내 메뉴와 모달 진입 추가`

## Progress

- [x] request와 현재 component/modal ownership 확인
- [x] implementation 및 component tests
- [x] lint, test, build
- [x] fresh QA review — final pass
- [x] local commit
- [x] push, Draft PR #59 갱신

## Verification

- `npm test -- src/features/room/page/hooks/useRoomRealtimeEvents.test.tsx src/features/room/page/ui/RoomPlaybackScreen.test.tsx src/features/room/page/ui/RoomPlaybackJoinedContent.test.tsx src/features/room/participants/model/participantIdentity.test.ts src/features/room/participants/ui/RoomParticipantList.test.tsx src/features/room/participants/ui/RoomParticipantsPanel.test.tsx` — 6 files, 50 tests passed
- `npm run lint` — passed
- `npm run test` — 153 files, 660 tests passed
- `npm run build` — passed
- local browser smoke — browser session unavailable; component integration tests cover mobile/desktop modal ownership

## Residual Risk

- 실제 로그인 방의 시각 smoke는 사용할 수 있는 browser session이 없어 자동 수행하지 못했다.
- modal close 후 원래 참가자 trigger로 focus를 복원하는 별도 계약은 기존 home modal에도 없어 이번 변경에서는 추가하지 않았다.
