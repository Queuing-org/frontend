# PR #45 Review Findings

## CI Run

- Workflow: `CI / Lint, test, and build`
- Run: https://github.com/Queuing-org/frontend/actions/runs/31584960055
- Head: `0ecca309f7fbf2d48e37b9f936d3d7464ece5c35`
- Classification: actionable

## Findings

1. `ChatArea.test.tsx`
   - 기존 테스트가 scroll 시 management menu가 닫힌다고 기대한다.
   - 현재 승인된 portal 동작은 scroll 중 menu를 유지하고 위치를 추적한다.
2. `RoomParticipantsPanel.test.tsx`
   - 기존 테스트가 신고 가능한 채팅이 없을 때 panel 내부 안내 문구를 기대한다.
   - 최신 요구는 참가자 panel 내부 관리 문구를 표시하지 않는 것이다.
3. `RoomFormModal.test.tsx`
   - edit submit button의 기존 accessible name `큐 수정하기`를 기대한다.
   - 현재 UI label은 `편집 완료`다.
4. `RoomPlaybackScreen.test.tsx`
   - `next/navigation` mock에 `useRouter`가 없어서 render가 실패한다.
   - 기존 테스트가 join 후 room meta 재조회를 하지 않는다고 기대하지만, 최초 0명 stale meta 보정을 위해 join 성공 후 재조회가 현재 계약이다.
5. `EditRoomFormModal.test.tsx`
   - 전체 local suite에서 새 router/delete dependency가 격리되지 않아 App Router invariant가 발생한다.
   - edit form mock에 후속 track-limit return contract도 누락돼 있다.

## Fix Scope

- 위 네 test file의 mock과 expectation만 최신 제품 계약에 맞춘다.
- production component/hook/CSS는 변경하지 않는다.

## Resolution

- Status: resolved locally
- Targeted affected suite: 5 files / 34 tests pass
- Full suite: 114 files / 389 tests pass
- lint/build: pass
