# QA Report

## 자동 검증

- 관련 targeted tests: 8 files / 48 tests passed
- 최종 개인 queue 오류 상태 보완 focused tests: 2 files / 8 tests passed
- 전체 tests: 138 files / 537 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

## Fresh read-only QA

- 기능 blocker 없음.
- 로그인 사용자의 개인 queue 조회 활성화, 서버 count 복원, 음악력 선택 scope, 버튼 활성 유지, hover/pressed CSS를 확인했다.
- QA가 발견한 개인 queue 요청 실패 시 `0` fallback은 응답 없음 상태를 `null`로 유지하도록 보완하고 회귀 검증했다.
- 보완 뒤 fresh 재검증 3 files / 9 tests와 `git diff --check`도 통과했다.

## 남은 수동 확인

- 실제 backend/STOMP 연결에서 새로고침 후 count와 재생곡 전환 상태를 확인한다.
- 실제 브라우저에서 hover/focus/pressed 대비를 육안 확인한다.
