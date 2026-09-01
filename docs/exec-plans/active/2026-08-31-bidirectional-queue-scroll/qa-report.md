# QA Report

## Result

- classification: `pass`
- blocking findings: 없음

## Boundary review

- backend history 응답의 `addedByUserSlug`, `playbackOrigin`, `startOffsetMs`와 frontend type이 일치한다.
- 내 노래 탭은 `USER_REQUESTED`이면서 현재 사용자의 공개 slug와 일치하는 history만 노출한다.
- 자동재생·타인·비로그인 cached history는 개인 목록에서 제외한다.
- 개인 시간축은 history → 본인 현재곡 → 본인 pending 순서이며 DnD와 삭제는 기존 pending 구간에만 유지한다.
- 전체/내 노래 모두 상단 history와 하단 queue 페이지네이션을 사용한다.
- 개인 history가 비어 스크롤 높이가 생기지 않아도 위쪽 wheel로 다음 과거 페이지를 요청한다.
- history와 active current는 같은 `#f7f7f9` 배경을 사용한다.
- 목록별 가상화 DOM 40행 상한을 유지한다.

## Verification

- `npm run test -- --run src/features/room/queue src/features/playlist`: 26 files, 101 tests passed
- focused final regression: 2 files, 22 tests passed
- `npm run test -- --reporter=dot`: 152 files, 628 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed
- fresh read-only QA: `pass`

## Residual risk

- 연결 가능한 인증 runtime이 없어 실제 공개/비공개 방과 모바일 터치 입력은 브라우저 실측하지 못했다.
