# 존재하지 않는 방 루트 이동

## 목표

- 직접 연 방의 메타 조회나 입장 요청이 `room.not-found`로 끝나면 오류 화면 대신 루트(`/`)로 교체 이동한다.
- 남아 있던 해당 방 접근 토큰을 폐기하고 잘못된 URL이 브라우저 뒤로가기에 남지 않게 한다.

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 구현 순서

1. 방 없음 오류의 기존 메타 조회·join 처리 경계를 확인한다.
2. 직접 URL 최초 진입과 비밀번호 제출 join에서 공통 루트 교체 이동을 적용한다.
3. 기존 `RoomPlaybackScreen` 스위트에 최소 회귀 사례를 추가한다.
4. targeted/full QA 후 한 기능 커밋으로 `dev`와 PR #52에 전달한다.

## 수용 기준

- 존재하지 않는 방의 메타 GET이 404이면 `/`로 `replace`한다.
- 메타 조회 뒤 방이 사라져 join이 `room.not-found`로 실패해도 같은 처리를 한다.
- 해당 slug의 저장 접근 토큰을 제거한다.
- 다른 입장 오류와 비밀번호 입력 흐름은 그대로 유지한다.

## 진행

- [x] 요청·현재 경계 조사
- [x] 구현·최소 회귀 테스트
- [x] 전체 QA·리뷰
- [ ] 커밋·push·PR 확인

## 검증 예정

- targeted Vitest
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`

## 잔여 위험

- blocker 없음. 리다이렉트는 방 메타/입장 경계의 404에만 한정한다.
