# 방 프로필 재구성과 관리 액션

## Scope

- 현재 신청자 프로필 패널을 사용자 정보, 액션 행, 2열 프로필 정보, 음악력 순서로 재구성한다.
- 팔로우 관계 버튼을 사용자 정보 아래 전체 행으로 이동하고 옆에 `관리` 버튼을 배치한다.
- 관리 버튼은 신고, 차단, 조건부 내보내기 dropdown menu를 연다.
- 온라인 상태 점은 프로필 패널에 표시하지 않는다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership

- 프로필 데이터 조합과 mutation 연결: `RoomProfilePanel`
- 관리 dropdown의 transient open/focus/Escape/outside-click 상태: profile feature leaf component
- 차단: 기존 `BlockUserModal`과 `useBlockUser`
- 내보내기: 기존 `useKickRoomParticipant`
- 방장/본인 판별: 공개 slug 기반 room owner 규칙

## Commit Slices

1. `feat(room): 프로필 관리 액션과 레이아웃 개편`
2. `docs(delivery): 프로필 관리 UI 검증 기록`

## Acceptance Criteria

- 프로필 상단에는 avatar, nickname, 방장 표시, `현재 큐잉 중...`만 표시하고 온라인 점은 없다.
- 팔로우 관계 버튼과 관리 버튼이 상단 정보 아래 같은 행에 표시된다.
- 관리 버튼은 버튼 아래 접근 가능한 dropdown menu를 열고 신고, 차단을 표시한다.
- 현재 사용자가 방장일 때만 내보내기를 표시하며 본인과 대상 방장에게는 표시하지 않는다.
- 차단은 실제 사용자 차단 확인 모달과 mutation에 연결된다.
- 내보내기는 기존 room password header 계약을 사용하는 kick mutation에 연결된다.
- 신고는 대상 사용자의 가장 최근 신고 가능한 채팅 `messageKey`를 기존 채팅 신고 모달/API에 연결한다.
- 현재 불러온 채팅에 신고 가능한 대상 메시지가 없으면 요청을 만들지 않고 안내 문구를 표시한다.
- 칭호, 한 줄 소개, 큐잉 횟수, 이용 시간, 음악력과 음악력 평가 동작은 유지된다.
- 관리와 음악력 위/아래 아이콘은 제공된 SVG를 사용하고 각각 `8x8`로 렌더링한다.
- targeted test, `npm run lint`, `npm run test`, `npm run build`, fresh QA가 통과한다.

## Progress

- [x] 기존 profile/follow/block/kick 계약 확인
- [x] 프로필 레이아웃과 관리 dropdown 구현
- [x] targeted/full QA
- [x] explicit staging, commit, push, Draft PR #33 갱신
- [x] 제공 SVG 아이콘 교체, 검증, push

## Residual Risk

- 프로필 신고는 현재 불러온 채팅 기록 안에서 대상의 최신 `messageKey`를 사용한다. 대상의 채팅이 아직 로드되지 않았으면 신고 가능한 메시지가 없다고 안내한다.
