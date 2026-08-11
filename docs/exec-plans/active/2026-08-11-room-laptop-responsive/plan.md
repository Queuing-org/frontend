# 방 내부 노트북 화면 대응

## 상태

- ready
- 브랜치: `dev`
- 전달 범위: 로컬 커밋까지만. push 및 PR 생성·갱신은 하지 않는다.

## 목표

- 채팅 상단 페이드 범위를 넓히되 끝의 투명 버퍼와 관리 메뉴 레이어를 유지한다.
- 브라우저 80% 축소에서 보기 좋은 기존 비율을 방 내부의 짧은 높이 데스크톱에 안전하게 적용한다.
- 전역 `zoom`/`transform` 없이 기존 compact 토큰과 플로팅 패널 좌표 보정 경로를 확장한다.

## 반응형 경계

- 모바일: `width <= 760px`, 기존 모바일 레이아웃 유지
- compact desktop: `width >= 761px && height <= 900px`
- normal desktop: `width >= 761px && height >= 901px`
- 대표 검증 뷰포트
  - compact: `1366x768`, `1536x864`, `1920x800`
  - normal: `1920x1080`, `1536x960`

## 구현 범위

- 채팅 페이드
  - 기본 104px, 96px에서 완전 투명, 마지막 8px 투명 버퍼
  - compact 83.2px, 76.8px에서 완전 투명, 마지막 6.4px 투명 버퍼
- 방 내부
  - 기존 `max-width: 1600px && max-height: 900px` compact media를 높이 중심 조건으로 확장
  - 플로팅 패널 density 계산도 동일한 경계로 통일
  - 누락된 플레이어 상태 문구와 채팅 플로팅 패널 안쪽 여백을 80% 비율로 보강
  - 친구 상세 플로팅 패널은 같은 density 계약을 사용하므로 CSS 경계도 함께 동기화

## 수용 조건

- 와이드하지만 낮은 `1920x800`에서도 방 내부 패널·컨트롤·플로팅 위젯이 compact 비율을 사용한다.
- `1920x1080`은 normal 크기를 유지한다.
- compact 전환 전후 드래그 패널 위치는 기존 좌표 변환 경로를 사용한다.
- 채팅 페이드는 배경 경계선 없이 더 넓어지고 열린 관리 메뉴가 페이드보다 위에 남는다.
- 모바일 분기와 방 생성·수정 화면은 이번 변경으로 재배치하지 않는다.

## 선택한 기술 경로

- `queuing-feature-delivery`: 로컬 전달, 검증, 커밋 경계를 관리한다.
- `queuing-orchestrator`: 화면·CSS·플로팅 좌표 계약을 하나의 실행 계획으로 묶는다.
- `queuing-ui-flow`: 방 내부 레이아웃과 상태 소유권을 보존한다.
- `frontend-architecture-guardrails`: viewport density의 단일 책임과 테스트 가능성을 점검한다.
- `queuing-qa-reviewer`: 최종 API/UI/state 경계와 검증 증거를 fresh read-only로 재검토한다.

## 진행

- [x] 기존 compact CSS와 플로팅 좌표 보정 경로 조사
- [x] 채팅 페이드 확대
- [x] 높이 중심 compact 조건 적용
- [x] 누락된 80% 요소 보강
- [x] targeted/full QA 및 fresh review
- [x] 로컬 커밋과 검증 문서 마감

## 예정 커밋

1. `c838d4f style(chat): 채팅 페이드 범위 확대`
2. `8043d11 feat(room): 노트북 compact 대응 확장`
3. `docs(delivery): 방 노트북 대응 검증 기록`

## 잔여 위험

- 연결된 브라우저가 없어 픽셀 단위 시각 확인은 정적 CSS 검토와 빌드 검증으로 대체했다.
- 500px 미만의 극단적으로 짧은 데스크톱 높이는 고정 80% compact만으로 일부 플로팅 패널 초기 위치가 빡빡할 수 있다.
- 공용 로딩 스피너는 방 밖 partial-compact 회귀를 피하려고 1920px wide-short에서 기존 크기를 유지한다.
