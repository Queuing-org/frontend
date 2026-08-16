# 방 내부 UI 후속 개선

## Scope

- 랜덤 입장 문구와 전체 트랙 카드의 내 노래·현재 재생 배경 우선순위를 조정한다.
- 데스크톱 방의 나가기 액션을 상단으로 옮기고 하단 X는 모든 플로팅 패널을 닫는다.
- 하단 아이콘, 방 프로필 헤더·팔로잉 배경을 지정 디자인으로 변경한다.
- 모바일 나가기 UI, 서버 API, 요청 스키마는 변경하지 않는다.

## Acceptance Criteria

- 랜덤 입장 실패 문구가 `입장 가능한 공개방이 없어요`로 표시된다.
- 전체 트랙의 내 노래는 `#3B82F6` 8% 배경이며 현재 재생 중이면 `#F7F7F9`가 우선한다.
- 데스크톱 좌상단 나가기 버튼은 기존 확인 흐름을 사용하고 하단 X는 네 플로팅 패널을 모두 닫는다.
- 첫 번째·참가자 아이콘과 방 프로필 헤더·팔로잉 상태가 요청한 디자인을 따른다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership Decisions

- 네 플로팅 패널의 일괄 닫기는 기존 `useFloatingWidgetsState`가 소유하고 open 저장 상태까지 동기화한다.
- 나가기 확인 상태와 포커스 복귀는 기존 방 화면이 계속 소유한다.
- 사용자 곡 판별은 기존 slug 기반 파생값을 유지하고 CSS 상태 우선순위만 바꾼다.
- 공용 프로필은 activity label 비표시만 허용하고 다른 프로필 기본 표시는 유지한다.

## Planned Commit

1. 기존 `feat(ui): 방과 재생목록 프로필 상호작용 개선` 커밋에 amend

## Progress

- [x] 요구사항과 저장소 규칙 확인
- [x] 관련 코드와 테스트 매핑
- [x] 구현 및 타깃 테스트
- [x] lint, 전체 test, build
- [x] fresh QA review
- [x] 기존 로컬 커밋 amend

## Verification

- 관련 Vitest 파일 — 55개 통과, 프로필 회귀 30개 재통과
- `npm run lint` — 통과
- `npm run test` — 122 files, 436 tests 통과
- `npm run build` — 통과
- `git diff --check` — 통과

## Residual Risk

- 연결 가능한 인앱 브라우저가 없어 실제 viewport 시각 확인은 수행하지 못했다. CSS 상태·상호작용 테스트와 production build로 대체 검증했다.
