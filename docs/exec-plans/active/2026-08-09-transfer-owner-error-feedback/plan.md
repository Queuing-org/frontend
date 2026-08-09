# 방장 위임 피드백 단순화

## Scope

- 방장 위임 성공 문구를 표시하지 않는다.
- 방장 위임 실패 문구만 잠깐 표시한 뒤 자동으로 제거한다.
- 위임 API와 성공 후 room meta cache 갱신은 유지한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership

- 위임 요청과 cache invalidation: 기존 `useTransferRoomOwner`
- 일시적인 실패 안내와 타이머: `useTransientManagementError`
- 화면별 위임 액션 연결: 프로필, 참가자 목록, 채팅 관리 메뉴

## Acceptance Criteria

- 위임 성공 callback은 성공 문구를 만들지 않는다.
- 위임 실패 문구는 alert로 표시되고 2초 후 사라진다.
- 새 위임 시도와 unmount는 이전 타이머를 정리한다.
- 세 진입점 targeted test, 공용 훅 test, lint, full test와 build가 통과한다.

## Commit Slice

1. `fix(room): 방장 위임 실패만 일시 안내`

## Progress

- [x] 기존 위임 feedback 경계 확인
- [x] 구현과 targeted test
- [x] lint, full test, build
- [x] fresh QA (`ship`)
- [ ] commit, push

## Constraints

- 사용자 소유 `src/features/follow/ui/FollowModal.module.css` 변경은 staging과 commit에서 제외한다.
