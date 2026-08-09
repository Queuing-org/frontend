# 프론트 런타임 감사 후속 최적화

## Scope

- `2026-08-09-frontend-runtime-audit/audit-report.md`의 confirmed finding을 실제 코드에 반영한다.
- room realtime/cache, participant/chat/queue, home/social/shared-build 세 lane으로 병렬 구현한다.
- 서버의 새 endpoint가 필요한 finding은 존재하지 않는 API를 만들지 않고, frontend에서 가능한 요청 억제·cache·windowing·cancel 처리까지 적용한다.
- 과거 backend compatibility 기록이 있는 STOMP fallback은 운영 frame 증거 없이 삭제하지 않는다.
- 제품 의도가 불명확한 dormant 기능과 backend 문자열 참조 가능성이 있는 public asset은 사용처를 재검증한 뒤에만 삭제한다.

## Selected Skills

- `queuing-orchestrator`
- `queuing-feature-delivery`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Commit Slices

1. `fix(room): 실시간 연결과 조회 중복 최적화`
2. `perf(room): 참가자 채팅 재생목록 렌더 최적화`
3. `perf(discovery): 홈 검색 소셜 초기 부하 최적화`
4. `refactor(frontend): 의존 경계와 미사용 코드 정리`
5. `docs(perf): 감사 후속 검증 기록`

## Acceptance Criteria

- 참가자 칭호 요청, 채팅/queue/room card DOM, 검색 요청, STOMP debug/connection의 상한이 테스트로 고정된다.
- GET QueryFunctionContext의 AbortSignal이 실제 Axios 요청까지 전달된다.
- mobile hard-load hydration에서 server/client 첫 snapshot이 일치한다.
- production initial bundle/font/image 낭비를 가능한 범위에서 줄이고 build artifact로 검증한다.
- confirmed dead import/export/CSS/dependency는 owner 확인 가능한 항목만 삭제한다.
- `npm run lint`, `npm run test`, `npm run build`, `git diff --check`, fresh read-only QA가 통과한다.
- `dev`에 기능 단위 커밋으로 push하고 기존 PR #37을 한국어로 갱신한다.

## Progress

- [x] 감사 결과와 적용 경계 재확인
- [x] room realtime/cache 최적화
- [x] participant/chat/queue 최적화
- [x] home/social/shared-build 최적화
- [x] 아키텍처 경계·미사용 코드 정리
- [x] 통합 테스트
- [x] fresh read-only QA
- [x] 기능 단위 commit 및 `dev` push
- [ ] PR #37 갱신 및 최신 head CI 확인
