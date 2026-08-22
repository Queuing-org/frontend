# Edge Config 기반 점검 모드

## Scope

- Vercel Edge Config의 단일 `maintenance` 객체로 점검 활성화 여부, 시작·종료 시각, 선택 안내 문구를 관리한다.
- Next.js Proxy가 점검 중인 페이지 요청을 `/maintenance`로 전환한다.
- 점검 페이지는 한국 시간 기준 점검 구간과 불편 사과 안내를 반응형으로 표시한다.
- 점검 페이지에서는 기존 CSRF, SSE, STOMP 전역 Provider를 시작하지 않는다.
- 백엔드·배포 워크플로가 같은 Edge Config 계약을 갱신할 수 있도록 전달 문서를 작성한다.
- 기존 접속자의 즉시 전환과 백엔드 `503` 차단은 백엔드 후속 계약으로 남긴다.

## Acceptance Criteria

- `maintenance.enabled === true`인 페이지 요청은 `/maintenance`로 이동한다.
- 점검 페이지, Next 정적 자산, public 파일, 프론트 API 경로는 Proxy 차단 대상에서 제외된다.
- `startsAt`과 `endsAt`이 유효하면 `Asia/Seoul` 기준으로 같은 날·날짜 경계 구간을 자연스럽게 표시한다.
- 시간이 누락되거나 잘못되어도 `enabled: true`인 점검 차단은 유지되고 일반 안내를 표시한다.
- Edge Config 연결 또는 조회가 실패하면 사이트 전체를 잘못 차단하지 않도록 fail-open하고 서버 로그를 남긴다.
- 점검 페이지는 기존 전역 API·SSE·STOMP Provider를 마운트하지 않는다.
- 로컬/Preview처럼 `EDGE_CONFIG`가 없는 환경은 정상 서비스로 통과한다.
- 백엔드 전달 문서에 설정 스키마, 보안 조건, 활성화·해제 순서와 기존 접속자 처리 계약이 포함된다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-api-boundary`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership

- 요청 전환: Next.js 예약 진입점 `src/proxy.ts`
- 외부 설정 검증·시간 표시 규칙: `src/shared/config/maintenance`
- 점검 화면: `src/app/maintenance`
- 점검 화면에서 전역 런타임 부작용 차단: app-scoped `Providers`
- 운영·백엔드 계약: 이 실행 계획의 `backend-handoff.md`

## Commit Slices

1. `feat(maintenance): Edge Config 점검 화면과 요청 차단 추가`
2. `docs(delivery): 점검 모드 운영 계약과 검증 기록`

## Progress

- [x] 요청, 아키텍처, 기존 런타임 Provider와 배포 규칙 확인
- [x] `dev` 브랜치와 clean worktree 확인
- [x] Edge Config 계약·Proxy·점검 페이지 구현
- [x] targeted/full QA
- [x] fresh read-only QA
- [ ] commit, push, Draft PR

## Verification

- maintenance config/parser/formatter targeted Vitest
- Proxy 통과·전환 targeted Vitest
- maintenance page 및 Provider side-effect targeted Vitest
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`

## Residual Risk

- Proxy는 새 HTTP 요청만 차단한다. 이미 방에 접속한 사용자의 즉시 전환은 백엔드 `SYSTEM_MAINTENANCE` 이벤트 또는 `503` 전역 처리가 추가되어야 한다.
- 실제 Production Edge Config 전파와 백엔드 배포 워크플로 호출은 Vercel·백엔드 저장소 권한이 필요한 수동 통합 QA 대상이다.
- 점검 중 프론트 공개 URL은 `307` 이후 점검 페이지 `200`을 반환하므로 백엔드 health check로 사용할 수 없다.
