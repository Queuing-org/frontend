# 방 생성 전 썸네일 업로드

## Scope

- 방 생성 모달에서 이미지 선택 직후 임시 썸네일 업로드 API를 호출한다.
- 성공 응답의 `uploadToken`을 방 생성 요청의 `thumbnailUploadToken`으로 전달한다.
- 업로드 진행 및 실패 상태를 기본 정보 단계에서 즉시 표시한다.
- 방 생성 후 썸네일 업로드와 실패 시 방 삭제 롤백 흐름을 제거한다.
- 기존 방 수정 썸네일 업로드 계약은 변경하지 않는다.

## Acceptance Criteria

- 유효한 파일 선택 즉시 `POST /api/v2/rooms/thumbnail` multipart 요청이 발생한다.
- 업로드 성공 전에는 다음 단계로 이동하거나 방 생성을 완료할 수 없다.
- 업로드 실패 메시지가 썸네일 입력 근처에 `role="alert"`로 표시된다.
- 재선택하면 이전 오류를 지우고 새 파일을 업로드한다.
- 썸네일이 있으면 방 생성 payload에 성공한 `thumbnailUploadToken`이 포함된다.
- 썸네일이 없으면 기존처럼 토큰 없이 방을 생성할 수 있다.
- 방 생성 뒤 썸네일 PUT 및 실패 롤백 DELETE는 실행하지 않는다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`
- `github:yeet`

## Ownership

- 임시 업로드 endpoint와 응답 envelope: `src/features/room/api`
- 업로드 mutation 상태: 방 생성 feature hook
- 선택 파일, 업로드 오류, 토큰과 단계 차단: 방 생성 모달의 로컬 흐름
- 기존 방 수정 업로드: 기존 hook과 PUT endpoint 유지

## Planned Commits

1. `feat(room): 방 생성 전 썸네일 업로드 적용`
   - API client, mutation hook, create payload, 모달 UI 흐름, 회귀 테스트, 실행 계획 증거
2. `docs: GitHub 발행 차단 상태 기록`
   - 로컬 커밋, 인증 차단 조건, 재개 절차
3. `docs: 썸네일 업로드 Draft PR 상태 기록`
   - 인증 복구 후 PR URL, 발행 상태, CI 대기 상태

## Progress

- [x] 계약과 기존 생성/업로드/롤백 흐름 확인
- [x] 임시 업로드 API 및 mutation 구현
- [x] 생성 모달 즉시 업로드 UI 구현
- [x] 테스트와 lint
- [x] production compile 및 TypeScript 검증
- [ ] 기존 전역 prerender 오류와 별개인 `npm run build` 성공
- [x] QA 검토
- [x] 로컬 커밋
- [x] push, draft PR

## Verification

- `npm run test`
- `npm run lint`
- `npm run build`
- `npx next build --webpack`
- 관련 생성 모달 테스트

## Residual Risk

- 백엔드 방 생성 endpoint의 `thumbnailUploadToken` 필드 지원은 제공된 명세 설명을 계약 근거로 사용한다.
- 기본 Turbopack build는 optimized production build 단계에서 무응답으로 정지했다.
- webpack build는 compile과 TypeScript를 통과한 뒤 기존 `/_global-error`의 `SsgoiProvider` 누락으로 실패했고, 같은 오류가 변경 없는 `origin/main`에서도 재현됐다.
- 업로드 중 모달을 닫으면 요청 취소 API 없이 임시 업로드가 TTL까지 남을 수 있다.
