# QA Report

## Automated verification

- targeted Vitest: 5 files / 35 tests pass
  - playback API 응답의 nested playback origin
  - 같은 현재곡의 `TRACK_STARTED` origin 보존
  - queue panel의 전체/내 탭 자동 순환 분기
  - 자동 순환 상태·현재곡 카드 제외·manual timeline 보존
  - panel view flag 전달
- `npm run lint`: pass
- `npm run test`: 152 files / 649 tests pass
- `npm run build`: pass
- `git diff --check`: pass

## Fresh read-only QA

- result: pass
- independent targeted verification: 7 files / 58 tests pass
- findings: blocker 없음
- reviewed boundaries: playback origin, realtime cache, 전체/내 탭, history/pending/manual current, 상태 접근성·reduced motion, 칭호 선택 표현

## Visual QA

- in-app Browser와 외부 browser 연결을 조회했으나 사용 가능한 browser가 없어 실제 화면 캡처 확인은 수행하지 못했다.
- CSS의 기본/compact 크기와 `prefers-reduced-motion` 규칙, DOM의 `role=status`와 장식 아이콘 숨김은 코드와 테스트로 확인했다.

## Residual risk

- 실제 방에서 backend가 `AUTOMATIC_REPLAY`를 반환하는 통합 흐름과 패널 높이별 중앙 정렬은 게시 후 브라우저에서 확인이 필요하다.
