# QA Report

## 결과

- verdict: pass
- fresh read-only review: pass after one scope fix
- browser visual QA: unavailable because no browser instance was connected

## 자동 검증

- targeted room/density tests: 7 files, 65 tests passed
- post-review targeted tests: 3 files, 22 tests passed
- `npm run test`: 108 files, 349 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

## 정적 수용 검증

- Chat fade
  - normal: 104px total, 96px transparent point, 8px transparent buffer
  - compact: 83.2px total, 76.8px transparent point, 6.4px transparent buffer
  - fade z-index 5, open message/menu layer z-index 10
- Viewport density
  - compact: 1366x768, 1536x864, 1920x800
  - normal: 1536x960, 1920x1080
  - mobile: width 760px 이하 기존 분기 유지
- Floating geometry
  - CSS와 JS가 같은 `width > 760 && height <= 900` 경계를 사용
  - 1920x800에서 width/height/placement가 기존 값의 80%
  - normal/compact 저장 키 분리 및 resize clamp 경로 유지

## Fresh review에서 잡아 수정한 내용

- `RoomInfo`와 `LoadingSpinner`의 height-only 규칙이 방 밖 화면까지 부분 compact를 퍼뜨릴 수 있었다.
- `RoomInfo`는 공용 기존 경계를 유지하고, wide-short 규칙을 `isRoom` 전용 클래스 하위에만 적용했다.
- `LoadingSpinner`는 공용 기존 경계로 복구했다.

## 잔여 위험

- 연결 브라우저가 없어 실제 desktop viewport 스크린샷과 드래그 체감 검증은 수행하지 못했다.
- 500px 미만의 극단적 세로 높이는 대표 지원 범위 밖이며 별도 최소 높이 정책이 필요할 수 있다.
- 1920x800 방 내부의 공용 spinner는 주변보다 80% 축소되지 않지만, 방 밖 partial-compact 회귀를 막기 위한 의도된 제한이다.
