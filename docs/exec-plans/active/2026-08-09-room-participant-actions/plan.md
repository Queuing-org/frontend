# 방 참가자 관리 메뉴와 방장 위임

## Scope

- 방장이 관리 가능한 참가자 카드에 hover/focus하면 채팅과 같은 `…` trigger를 노출한다.
- `…` trigger를 누르면 채팅과 같은 타이트한 공통 dropdown으로 관리 액션을 제공한다.
- 회원 참가자에게 팔로우/언팔로우, 신고, 차단, 내보내기, 방장 위임을 제공한다.
- 게스트 참가자에게는 식별자가 지원되는 내보내기만 제공하고 회원 전용 액션은 숨긴다.
- 바깥 클릭, 같은 참가자 카드 재클릭, Escape로 열린 메뉴를 닫는다.

## Selected Skills

- `queuing-orchestrator`
- `queuing-feature-delivery`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership

- 열린 참가자 한 명의 transient 상태: `RoomParticipantList`
- 참가자별 액션 표시와 접근성: participants UI leaf components
- 신고/차단 modal target과 kick/transfer mutation: `RoomParticipantsPanel`
- 방장 위임 API와 캐시 무효화: room API/hook
- 참가자 신고용 최신 채팅 선택: 상위 room screen이 보유한 chat messages를 panel에 전달

## Acceptance Criteria

- 관리 가능한 참가자 카드 hover/focus에서 `…` trigger가 보이고 카드 본문은 거짓 클릭 영역이 아니다.
- 기존 참가자 행의 단독 `내보내기` 버튼은 제거된다.
- 방장이 본인이 아닌 참가자의 `…`를 누르면 채팅과 동일한 크기의 관리 dropdown이 열린다.
- 같은 `…`를 다시 누르거나 바깥을 누르거나 Escape를 누르면 목록이 닫힌다.
- 회원에게는 현재 관계에 따른 팔로우/언팔로우, 신고, 차단, 내보내기, 방장 위임이 표시된다.
- 게스트는 회원 slug와 채팅 발신자 식별이 필요한 팔로우, 신고, 차단, 방장 위임이 표시되지 않고 내보내기만 표시된다.
- 방장 위임은 `PATCH /api/v1/rooms/{slug}/owner`에 `{ userSlug }`를 전송한다.
- 위임 성공 후 방장과 권한 판정 원본인 room meta를 갱신하고 성공 안내를 표시한다.
- 신고 가능한 채팅이 없으면 네트워크 요청 없이 안내를 표시한다.
- targeted test, `npm run lint`, `npm run test`, `npm run build`, fresh QA가 통과한다.

## Progress

- [x] 기존 profile/follow/block/report/kick 계약 확인
- [x] 방장 위임 API와 mutation 구현
- [x] 참가자 카드 액션 메뉴와 modal 연결
- [x] targeted/full QA
- [x] user-owned CSS를 제외한 explicit staging과 code commit
- [x] `dev` push와 Draft PR #36 갱신
- [x] 참가자 카드 전체 trigger를 hover/focus `…` trigger로 교체
- [x] 채팅 공통 dropdown 재사용과 targeted/full QA
- [x] commit
- [x] push, Draft PR #36 갱신
- [x] 팔로우/언팔로우 hover divider 색을 다른 관리 액션과 통일

## Residual Risk

- 회원 신고는 현재 클라이언트에 불러온 채팅에서 참가자의 최신 `messageKey`를 찾는다. 아직 불러오지 않은 메시지만 있으면 신고할 수 없다는 안내가 표시된다.
- 게스트 채팅에는 참가자 `participantId`가 없어 특정 게스트와 안전하게 연결할 수 없다. 닉네임 추정은 하지 않으며 백엔드 식별자 또는 별도 참가자 신고 API가 생길 때까지 게스트 신고는 제공하지 않는다.
- 다른 접속자의 방장 표시와 권한 즉시 반영은 백엔드 WebSocket 방장 변경 이벤트 지원 여부에 의존한다.
