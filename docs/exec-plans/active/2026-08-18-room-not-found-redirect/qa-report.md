# QA Report

## 결과

- classification: `pass`
- blocking finding: 없음

## 경계 검토

- `RoomPlaybackScreen`이 직접 URL의 pre-join 메타 조회와 join 상태를 이미 소유하므로 라우트 파일에 중복 fetch를 추가하지 않았다.
- 메타 GET의 HTTP 404와 join의 `room.not-found`를 같은 판별로 처리한다.
- 루트 이동 전에 room-scoped `sessionStorage` 접근 토큰을 제거한다.
- `window.location.replace("/")`로 루트 문서를 새로 불러 잘못된 방 URL과 기존 메모리 QueryClient 캐시를 함께 폐기한다.
- 새 루트 문서의 `HomeScreen`은 빈 캐시에서 방 목록 GET을 다시 시작하므로 기존 목록을 먼저 그리지 않는다.
- 비밀번호 오류, 연결 오류, 이미 참여 중인 방 확인 흐름은 기존 분기를 유지한다.
- 테스트는 기존 `RoomPlaybackScreen` 스위트에서 문서 교체 이동 호출·토큰 제거·join 미전송을 함께 검증한다.

## 검증

- targeted Vitest: 2 files / 10 tests passed
- full Vitest: 145 files / 563 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

후속 전체 문서 교체 이동 검증:

- targeted Vitest: 1 file / 8 tests passed
- full Vitest: 145 files / 563 tests passed
- `npm run lint`: passed
- `npm run build`: passed

## 참고

- 전체 테스트의 기존 `next/image` mock 비표준 boolean attribute 경고는 남아 있으나 테스트 종료 코드는 0이고 이번 diff와 무관하다.
- JSDOM은 실제 문서 탐색을 수행하지 않으므로 브라우저 API 호출 경계를 mock으로 검증했다. `Location.replace`의 실제 브라우저 동작은 표준 동작에 의존한다.
