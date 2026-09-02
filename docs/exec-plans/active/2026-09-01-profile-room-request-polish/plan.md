# 프로필·방 편집·노래 신청 UI 후속 정리

## Scope

- 설정 최애곡 입력 상한을 20자에서 40자로 늘리고 공개 프로필에서 말줄임 없이 여러 줄로 표시한다.
- 방 편집 모달 너비를 방 내부 메인 컨테이너 너비와 맞춘다.
- 방 편집 하단 삭제·완료 버튼 높이를 같은 화면의 드롭다운 높이와 맞춘다.
- 노래 신청의 `사연 (선택)` 문구를 `노래 선정 이유 (선택)`로 변경하고 하단 액션에 pill hover/focus 배경을 적용한다.
- YouTube URL 입력 글자 크기를 같은 필드의 라벨 크기와 맞춘다.
- `dev`에 커밋·푸시한다. 게시 중 PR #58이 먼저 병합되어 이번 변경은 새 Draft PR #59로 전달한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership Decisions

- 최애곡 입력 상한과 저장 전 정규화는 기존 settings form model/hook이 계속 소유한다.
- 프로필 줄바꿈은 공유 `UserProfileContent`가 소유해 방·친구 프로필에 동일하게 적용한다.
- 방 편집 치수는 `EditRoomFormModal.module.css`에서 방 메인 셸의 normal/compact 치수와 동일하게 관리한다.
- 노래 신청 문구와 입력/액션 표현은 add-track UI와 CSS module에서만 변경한다.

## Commit Slices

1. `fix(ui): 프로필과 방 편집 치수를 정리`
2. `fix(playlist): 노래 신청 문구와 입력 스타일 정리`
3. `docs(delivery): UI 후속 검증 기록`

## Acceptance Criteria

- 최애곡은 최대 40자까지 입력·저장 payload에 유지되고 카운터와 접근성 설명도 40자를 안내한다.
- 두 줄 프로필에서 최애곡은 말줄임표 없이 자연스럽게 줄바꿈되고 최소 두 줄 높이를 확보한다.
- 방 편집 모달은 normal 688px, compact 550.4px이며 좁은 화면에서는 기존 반응형 제한을 유지한다.
- 방 편집 삭제·완료 버튼은 normal 56px, compact 44.8px, mobile 52px로 같은 화면의 select 높이와 일치한다.
- 노래 신청 이유 문구, pill hover/focus, URL 입력·라벨 글자 크기가 회귀 테스트와 CSS 검토를 통과한다.
- `npm run lint`, `npm run test`, `npm run build`, `git diff --check`, fresh read-only QA가 통과한다.

## Progress

- [x] 요청과 관련 경계 확인
- [x] 구현 및 대상 테스트 보강
- [x] 전체 로컬 검증
- [x] Fresh read-only QA
- [x] `dev` 커밋·푸시 및 Draft PR #59 게시

## Residual Risk

- 배포 API의 공개 OpenAPI 경로가 404라 `statusMessage`의 현재 서버 최대 길이는 문서로 재검증하지 못했다. 프런트엔드의 과거 계약은 255자였고 이번 전송 형태는 변경하지 않는다.
- 실제 글자 폭은 언어와 글꼴에 따라 달라진다. 말줄임 대신 자연 줄바꿈을 사용해 제목 손실을 피한다.
- in-app Browser에 연결 가능한 브라우저 인스턴스가 없어 실제 화면 스크린샷 QA는 수행하지 못했다.

## Publication Note

- 기존 PR #58은 이번 커밋 push 전에 병합되었다. 병합된 PR의 제목·본문은 원래 범위로 복구하고, `origin/main..dev`의 새 커밋 3개를 Draft PR #59로 게시했다.
