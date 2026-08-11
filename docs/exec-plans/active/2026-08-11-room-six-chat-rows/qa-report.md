# QA Report

## 결과

- verdict: pass
- fresh read-only review: pass after mobile YouTube error-layout scope fix
- browser visual QA: unavailable because no browser instance was connected

## 자동 검증

- targeted: 5 files, 43 tests passed
- `npm run test`: 109 files, 370 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

## 계산 검증

- normal fixed chrome: `60 + (76+24+16) + 30 + 16*2 = 238px`
- compact fixed chrome: `48 + (60.8+19.2+12.8) + 24 + 12.8*2 = 190.4px`
- one-line row: `40*density + 4*density*2 = 48*density`
- six rows: `48*6 + 16*5 + 28 = 396`, then viewport density 적용
- requester card: `44*density + 20*density*2 = 84*density`
- `600~2160px` 모든 정수 높이에서 requester 유무 각각 available chat height가 six-row minimum 이상

## 대표 viewport

- `3840x2160`, `2560x1440`: 기존 최대 크기 유지
- `1920x1080`: density 0.98
- `1536x960`: density 0.86
- `1536x864`: density 약 0.781
- `1366x768`, `1024x768`: density 약 0.730, 영상 폭 약 377px
- `1280x720`: density 약 0.704, 영상 폭 약 315px
- `1024x600`: density 0.64, 영상 약 161x90px

## Fresh review 수정

- desktop 높이 계산을 위해 YouTube 오류 패널을 overlay 처리했으나 최초 구현은 모바일까지 바꿨다.
- absolute overlay를 `min-width: 761px`로 제한해 모바일의 기존 flow 배치를 복구했다.
- hydration 전에는 requester 유무별 CSS `dvh` fallback을 사용하고, ready 후에만 같은 계산의 inline 변수를 적용한다.

## 잔여 위험

- 연결 브라우저가 없어 4K·태블릿 실제 pixel/drag QA를 수행하지 못했다.
- `900→901px`에서 기존 room compact chrome 경계 때문에 신청자 포함 영상 폭이 약 `512→463px`로 역행한다. clipping과 6행 조건은 유지된다.
- 600px 높이는 6행을 우선해 영상·신청자 보조 글자·관리 타깃이 작다. 실사용 권장 높이는 720px 이상이다.
- 600px에서 83.2px fade가 상단 약 두 행에 걸치지만 여섯 행 자체는 목록 viewport 안에 존재한다.
- CSS first-paint fallback과 TypeScript 계산 상수의 자동 대조 테스트는 없으므로 향후 두 계약을 함께 수정해야 한다.
