# 방 큐·모달 UI 교정

## Scope

- 내 노래 탭에서 현재 재생곡과 같은 history 항목이 중복 표시되지 않게 한다.
- 노래 신청 URL 입력 영역 이후 다음 섹션까지의 간격을 40px로 통일한다.
- 방 내부에서 연 Settings/Friends 모달만 배경을 어둡게 처리한다.
- Friends와 Settings 데스크톱 모달의 기본 높이를 540px로 맞춘다.
- Friends 목록에서 연 프로필 상세의 누락된 상단 패딩을 복원한다.

## Acceptance Criteria

- 동일한 `entryId`의 현재곡과 history는 내 노래 타임라인에 한 번만 보인다.
- 일반 URL 폼은 URL 입력 필드 아래부터 선정 이유 타이틀까지 40px이다.
- 재생목록 선택지가 나타난 폼은 선택지 영역 아래부터 선정 이유 타이틀까지 40px이다.
- 방 내부 Settings/Friends가 열리면 방 배경에 dim이 생기고 홈/검색 호출부는 기존 배경을 유지한다.
- Friends와 Settings 데스크톱 기본 모달 높이는 540px이다.
- Friends 프로필 상세의 본문 상단 여백이 일반/compact 레이아웃 비율에 맞게 보인다.

## Selected Skills

- queuing-feature-delivery
- queuing-orchestrator
- queuing-ui-flow
- frontend-architecture-guardrails
- queuing-qa-reviewer

## Ownership

- 큐 타임라인 파생 데이터: `useRoomQueuePanel`
- 노래 신청 레이아웃: `AddTrackModal.module.css`
- 방 내부 modal dim 여부: `RoomPlaybackJoinedContent`가 호출 문맥을 소유하고 각 modal은 표현 옵션만 받는다.
- Friends/Settings 크기와 Friends 상세 패딩: 각 feature CSS module

## Commit Slices

1. `fix(room): 큐와 모달 UI 표시 오류를 교정`
2. `docs(delivery): 방 큐와 모달 UI QA를 기록`

## Progress

- [x] 관련 렌더 경로와 CSS 원인 확인
- [x] 실행 계획/상태 기록
- [x] 구현 및 targeted test
- [x] lint/test/build
- [x] fresh read-only QA
- [x] feature commit (`c0734f2`), push, Draft PR #61 게시

## Verification

- queue hook 및 room modal targeted Vitest
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`

결과:

- targeted Vitest: 5 files / 26 tests pass
- full Vitest: 155 files / 688 tests pass
- lint: pass
- build: pass
- `git diff --check`: pass
- fresh read-only QA: 1차 `fix`, Settings compact 432px override 제거 후 최종 `pass`
- browser visual QA: 브라우저 세션 unavailable로 미실시

## Residual Risk

- 실제 브라우저의 40px 간격, dim stacking, 프로필 padding 픽셀 배치는 수동 확인이 필요하다.
- compact density는 57.6px 친구 행을 사용하므로 540px에서 약 8행이 보이며, 약 6.5행은 normal density 기준이다.
- 매우 낮은 데스크톱 viewport의 540px Settings 안전 영역은 후속 반응형 QA가 필요하다.
