# 채팅·프로필 관리 액션 통일과 채팅 합성 버그 수정

## Scope

- 채팅 메시지 `…` 메뉴에 관계 기반 팔로우/언팔로우, 신고, 차단, 조건부 내보내기와 방장 위임을 제공한다.
- 현재 곡 신청자 프로필은 카드 hover/focus에서 `…` trigger를 노출하고 채팅과 같은 관리 dropdown을 제공한다.
- 채팅 영역 상단에서 간헐적으로 하얀 선이 번쩍이는 초기 렌더·스크롤·합성 문제를 진단하고 가장 좁은 CSS/레이어 수정으로 제거한다.

## Selected Skills

- `queuing-orchestrator`
- `queuing-feature-delivery`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `browser:control-in-app-browser`
- `queuing-qa-reviewer`

## Ownership

- 메시지별 열린 메뉴와 modal target: `ChatArea`
- 프로필의 hover/focus trigger와 열린 관리 메뉴: `RoomProfilePanel`
- 방장/참가자 식별과 kick target: room screen이 가진 participants와 room meta에서 파생
- 팔로우/차단/신고/kick/transfer mutation: 기존 feature hooks 재사용
- 흰 선 수정: chat scroll surface와 room panel CSS 경계

## Commit Slices

1. `feat(room): 채팅과 프로필 관리 액션 통일`
2. `fix(room): 채팅 스크롤 합성 깜빡임 방지`
3. `docs(delivery): 채팅 프로필 관리 검증 기록`

## Acceptance Criteria

- 회원의 타인 채팅 `…` 메뉴에 팔로우 또는 언팔로우, 신고, 차단이 표시된다.
- 현재 사용자가 방장이고 대상 회원이 방에 참여 중이면 내보내기와 방장 위임도 표시된다.
- 게스트 채팅은 안전하게 식별 가능한 기존 신고만 제공하고 회원 전용 액션을 노출하지 않는다.
- 본인 채팅에는 관리 메뉴가 표시되지 않는다.
- 프로필 패널은 대상이 본인이 아닐 때 hover/focus에서 `…` trigger를 노출하고, 채팅과 같은 액션 dropdown을 연다.
- 메뉴는 같은 trigger 재클릭, 바깥 클릭, Escape로 닫히고 keyboard focus가 유지된다.
- 채팅 상단에서 초기 진입 후 하얀 선이 번쩍이는 합성 경로를 제거하고 scroll/overflow 동작을 유지한다.
- targeted test, lint, full test, build, fresh QA가 통과한다.

## Progress

- [x] 기존 채팅·프로필·참가자 액션 경계 조사
- [x] 공용 권한/액션 모델과 UI 구현
- [x] 채팅 합성 깜빡임 수정
- [x] targeted/full QA
- [x] commit
- [ ] push, Draft PR #36 갱신

## Constraints

- 사용자 소유 `src/features/follow/ui/FollowModal.module.css` 변경은 staging/commit에서 제외한다.
- 방장 위임 REST 계약은 기존 `useTransferRoomOwner`를 재사용한다.
- 다른 접속자의 방장 상태 실시간 반영은 문서 없는 WebSocket 이벤트를 추측해 구현하지 않는다.
