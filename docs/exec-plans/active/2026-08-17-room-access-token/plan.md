# roomAccessToken 방 세션 인증 전환

## 목표

- 최초 join 성공 시 받은 `roomAccessToken`을 탭 단위로 보관하고 비밀번호를 더 이상 유지하지 않는다.
- 재접속 join, 방 토픽 구독, 방 내부 REST 요청을 접근 토큰 계약으로 통일한다.
- 비밀번호 변경 뒤에도 기존 참가 세션을 유지하고 `ROOM_INFO_UPDATED`를 방 정보 갱신과 단일 토스트로 반영한다.

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 구현 순서

1. join 결과와 토큰 저장 경계 전환
2. 재접속·STOMP 토픽·REST 인증 전환
3. 종료 이벤트 정리와 방 정보 변경 토스트
4. 계약 문서와 회귀 테스트 갱신
5. 전체 QA, fresh review, Draft PR #52 갱신

## 수용 기준

- 최초 join은 `password`, 재접속은 `accessToken` 중 하나만 전송한다.
- 유효한 `ROOM_JOINED.data.roomAccessToken` 수신 뒤에만 방 토픽과 내부 REST 조회를 시작한다.
- 토큰은 `sessionStorage`의 방별 키에 보관하며 URL·로그·React Query key에 포함하지 않는다.
- 소켓 연결 종료만으로 토큰을 지우지 않고 명시적 leave·강퇴·세션 교체·방 삭제·접근 거부에서 지운다.
- 방 정보 변경은 전체 메타를 재조회하고 `방 정보가 변경되었어요` 알림을 중복 없이 표시한다.
- 기존 `room.already-participating` 동일 소켓 재요청 계약을 유지한다.

## 진행

- [x] 요청·현재 인증 경계 조사
- [x] join 결과와 저장소 구현
- [x] REST·토픽·재접속 구현
- [x] 종료·토스트 구현
- [x] targeted/full QA
- [x] fresh review
- [x] commit, push, PR #52 갱신

## 검증

- targeted Vitest
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`

현재 결과:

- focused: 4 files / 27 tests 통과(계약별 targeted suite도 통과)
- full: 145 files / 552 tests 통과
- lint: 통과
- build: 통과
- diff check: 통과

## 잔여 위험

- 새 토큰 계약은 기존 평문 비밀번호 보관 계약을 완전히 대체하므로 deprecated header fallback은 두지 않는다.
