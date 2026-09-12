# 프로필 통계 정렬과 한글 제목 검색 대기 수정

- 요청: 이용 시간을 큐잉 횟수 높이에 맞추고, 엔터 없이는 노래 검색이 완료되지 않는 원인을 확인한다.
- branch: dev / base: main
- selected_skills: queuing-feature-delivery, queuing-orchestrator, queuing-ui-flow, queuing-api-boundary, frontend-architecture-guardrails, queuing-qa-reviewer, queuing-incident-curator, browser:control-in-app-browser
- 소유권: 공유 프로필 CSS가 통계 배치, playlist query hook이 검색 디바운스, 입력 컴포넌트가 IME 키보드 선택 방어를 소유한다. API 계약과 mutation은 변경하지 않는다.
- 수용 기준: 짧은 최애곡에서 이용 시간이 기존 큐잉 횟수 위치와 정렬되고 긴 문구에도 양쪽 통계가 같은 행에 있다. 조합 종료/엔터 없이 300ms 입력 정지 후 검색한다. 조합 중 Enter는 선택하지 않는다. 취소/오래된 응답/URL/에러 동작을 유지한다.
- 커밋 순서: 1. fix(profile): 프로필 통계의 행 높이를 맞춤 2. fix(playlist): 한글 조합 종료를 기다리던 자동 검색 수정 (회귀 테스트와 실행·사고 기록 포함).
- 검증: 검색 재현 테스트를 먼저 실행해 기존 실패 확인 → 수정 후 targeted test, lint, 전체 test, build → 독립 read-only QA → commit/push/draft PR.
- 진행: 구현 완료. 수정 전 회귀 실패 확인, targeted 9 tests / 전체 714 tests / lint / build / 독립 QA pass. dev 게시 및 Draft PR #63 생성 완료. CI 대기.
- 커밋: ba921c7 (프로필), a4ccfcc (검색·테스트·원인 기록).
- 잔여 위험: 운영 API 응답 시간 및 실제 OS IME 이벤트는 별도 관측하지 않음.
