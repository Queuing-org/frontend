# QA Report

## Result

- classification: `pass`
- fresh reviewer first result: `fix`
  - 본인 음악력 버튼이 숨겨지던 문제 수정
  - 방 STOMP 재구독 훅 테스트 추가
- fresh reviewer re-review: `pass`

## Automated

- `npm run test`: pass — 30 files, 77 tests
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass

검증 범위에는 음악력 PUT/DELETE, badgeCode, queue cursor/revision/409 재시작, history cursorId, Retry-After, SSE 순차/중복 제거, presence 버전 순서, 방 WebSocket cache 변환·재구독, 상태 메시지 삭제, 지난 곡 pagination, 썸네일 편집 제거가 포함된다.

## Local Smoke

개발 서버를 HTTPS로 기동해 아래 경로의 서버 렌더 응답과 로그를 확인했다.

- `/home`: 200
- `/search`: 200
- `/room/nonexistent-v26-qa`: 200
- Next.js 서버 로그: compile/render 오류 없음

Codex in-app browser 연결은 코드와 무관한 실행 도구 메타데이터 오류(`sandboxPolicy` 누락)로 두 번 실패했다. HTTP smoke로 렌더 경로를 보완했으며, 이 실패를 브라우저 UI 검증 성공으로 간주하지 않았다.

## Residual Manual Scenarios

다음 항목은 인증된 두 계정과 실제 backend-core 이벤트/공개·비공개 방 fixture가 없어 수행하지 못했다.

- 두 사용자 음악력 즉시 동기화
- 실제 badge SSE 획득, 재연결, 연속 모달
- 팔로우 사용자 접속/방 이동 실시간 반영
- 공개·비공개 방 비밀번호 헤더의 실제 네트워크 확인

해당 경계는 자동 테스트로 검증했지만, 배포 전 통합 환경에서 별도 수동 확인이 필요하다.
