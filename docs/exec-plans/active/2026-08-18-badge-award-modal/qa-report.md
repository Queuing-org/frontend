# QA Report

## Result

- classification: `pass`
- blocking findings: none
- fresh reviewer: 최신 시안 후속 교정까지 read-only pass

## Verified boundaries

- `badge-awarded` SSE는 `description: string | null`을 필수 필드로 엄격하게 파싱하고 여러 칭호의 수신 순서와 이벤트별 중복 제거를 유지한다.
- 서버 `description`은 trim 후 그대로 사용해 `하여 새로운 칭호를 획득했습니다!`를 연결하고, `null` 또는 공백이면 `새로운 칭호를 획득했습니다!`로 대체한다.
- 본문은 달성 문장과 `더 열심히 참여해서 다음 칭호도 획득해보세요.` 문장을 별도 span으로 정확히 두 줄 구성한다.
- `적용하기`는 기존 대표 칭호 mutation을 호출하며 성공 시 내 칭호·내 프로필·공개 프로필 캐시를 갱신하고 다음 칭호로 이동한다.
- 적용 실패 시 현재 칭호를 유지하고 오류를 알리며, pending 동안 확인·Escape·배경 닫기를 잠근다.
- 여러 칭호는 순서대로 표시하고 폭죽 effect는 칭호 전환·닫힘 시 AbortController로 정리한다.
- 모달은 portal, 접근 가능한 dialog 이름, 최초 포커스, 양방향 Tab 순환, pending 중 포커스 유지, pending 해제 후 액션 포커스 복구, 전체 모달 종료 후 이전 포커스 복원을 제공한다.
- 데스크톱 640×370·40px padding·20px radius와 본문 20px를 적용하고, 좁은 화면에서만 문장 내부 줄바꿈과 모바일 축소를 허용한다.
- `적용하기`는 `#3B82F6` 채움 버튼을 유지하고, `확인`은 기본 투명 배경·파란 글자와 hover/focus의 8% 파란 배경을 사용한다.

## Commands

- focused: 4 files / 16 tests passed
- full: 145 files / 561 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

## Fresh QA follow-up

- 최초 finding: 모달 focus trap·종료 후 focus 복원 누락 — fixed.
- 후속 finding: mutation pending 해제 뒤 Shift+Tab 탈출 가능 — fixed and regression-tested.
- 이전 QA의 자유형 `description` 조사 결합 우려는 최신 서버 계약 전제로 대체됐다. trim된 값 뒤에 `하여`를 정확히 연결하고 formatter의 값 있음·null·공백 회귀 테스트를 추가했다.
- 최신 시안 교정: 두 문장 DOM 분리, 640×370 CSS 규격, 모바일 wrap, 확인 버튼 기본/hover/focus 상태를 정적 검토했다.

## Manual QA

- 실제 로그인 세션에서만 발생하는 개인 SSE 이벤트라 브라우저 수동 수신은 이번 로컬 검증에서 수행하지 않았다.
- DOM 상호작용 테스트와 CSS 정적 검토로 문구, 액션, 포커스, pending, 오류, 크기·색상 계약을 검증했다.

## Residual risk

- SSE는 서버가 최근 이벤트를 메모리에 임시 보관하는 계약이므로 서버 재시작이나 장시간 미접속 시 과거 칭호 알림이 재생되지 않을 수 있다. 이는 프론트 모달 범위 밖의 서버 보관 정책이다.
