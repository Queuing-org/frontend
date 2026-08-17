# QA Report

## Result

- classification: `pass`
- blocking findings: none
- fresh reviewer: pass after focus/accessibility and free-form copy fixes

## Verified boundaries

- `badge-awarded` SSE는 `description: string | null`을 필수 필드로 엄격하게 파싱하고 여러 칭호의 수신 순서와 이벤트별 중복 제거를 유지한다.
- 서버 `description`은 문장 형태를 추정하거나 조사를 합성하지 않고 원문 그대로 표시하며, 값이 비면 칭호 이름 기반 대체 문구를 사용한다.
- `적용하기`는 기존 대표 칭호 mutation을 호출하며 성공 시 내 칭호·내 프로필·공개 프로필 캐시를 갱신하고 다음 칭호로 이동한다.
- 적용 실패 시 현재 칭호를 유지하고 오류를 알리며, pending 동안 확인·Escape·배경 닫기를 잠근다.
- 여러 칭호는 순서대로 표시하고 폭죽 effect는 칭호 전환·닫힘 시 AbortController로 정리한다.
- 모달은 portal, 접근 가능한 dialog 이름, 최초 포커스, 양방향 Tab 순환, pending 중 포커스 유지, pending 해제 후 액션 포커스 복구, 전체 모달 종료 후 이전 포커스 복원을 제공한다.
- 데스크톱 496×370·40px padding·20px radius, 칭호 라벨 164×36, 지정 색상·타이포와 기존 모달 규격의 88×40 버튼을 적용하며 모바일에서는 세로 overflow를 허용한다.

## Commands

- focused: 4 files / 13 tests passed
- full: 145 files / 558 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

## Fresh QA follow-up

- 최초 finding: 모달 focus trap·종료 후 focus 복원 누락 — fixed.
- 후속 finding: mutation pending 해제 뒤 Shift+Tab 탈출 가능 — fixed and regression-tested.
- 후속 finding: 자유형 `description` 조사 결합 위험 — 원문과 고정 안내 문장 분리로 fixed.

## Manual QA

- 실제 로그인 세션에서만 발생하는 개인 SSE 이벤트라 브라우저 수동 수신은 이번 로컬 검증에서 수행하지 않았다.
- DOM 상호작용 테스트와 CSS 정적 검토로 문구, 액션, 포커스, pending, 오류, 크기·색상 계약을 검증했다.

## Residual risk

- SSE는 서버가 최근 이벤트를 메모리에 임시 보관하는 계약이므로 서버 재시작이나 장시간 미접속 시 과거 칭호 알림이 재생되지 않을 수 있다. 이는 프론트 모달 범위 밖의 서버 보관 정책이다.
