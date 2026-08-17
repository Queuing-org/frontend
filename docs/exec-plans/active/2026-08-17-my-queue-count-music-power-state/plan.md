# 새로고침 내 신청곡 수·음악력 버튼 상태 수정

## 상태

- ci-pending
- 실행일: 2026-08-17
- 브랜치: `dev`
- 전달 대상: 기존 Draft PR #51

## 범위

- 방 새로고침 뒤 서버에 내 pending 신청곡이 있어도 UI가 0개로 표시되는 원인을 수정한다.
- 음악력 올리기/내리기 hover 색을 더 진하게 만든다.
- 현재 곡에서 선택한 방향의 색을 유지하되 버튼을 disabled 처리하지 않는다.
- 재생 entry가 바뀌어 다시 평가할 수 있으면 선택 색을 초기화한다.

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 수용 기준

- 초기 room queue 조회 완료 뒤 내 pending 신청곡 개수가 실제 항목 수와 일치한다.
- 실시간 추가/삭제/재생 변경에서도 개수가 기존처럼 일관되게 갱신된다.
- 음악력 버튼 hover 색이 기본색보다 진하다.
- 평가 성공 또는 이미 평가한 상태에서 선택 방향 색이 현재 재생 entry 동안 유지된다.
- 선택 이후에도 두 버튼은 disabled가 아니며 재클릭 시 기존 안내 흐름을 유지한다.
- 재생 entry가 바뀌면 이전 선택 색이 남지 않는다.
- targeted tests, lint, 전체 test, build, diff-check, fresh read-only QA가 통과한다.

## 커밋 계획

1. `fix(queue): 새로고침 내 신청곡 수 복원`
2. `feat(profile): 음악력 선택 상태 표시`
3. `fix(queue): 내 신청곡 수 로딩 상태 구분`
4. `docs(delivery): 큐 개수와 음악력 UI 검증 기록`

## 진행

- [x] 브랜치·worktree·전달 PR 확인
- [x] 큐 count 데이터 흐름 조사 및 수정
- [x] 음악력 vote 상태와 CSS 흐름 조사 및 수정
- [x] targeted verification
- [x] 전체 검증과 fresh read-only QA
- [ ] 커밋·push·PR #51 본문/CI 갱신

## 잔여 위험

- 실제 backend/STOMP 환경의 새로고침 및 곡 전환과 CSS pseudo-state 육안 확인은 자동 테스트와 별도다.
