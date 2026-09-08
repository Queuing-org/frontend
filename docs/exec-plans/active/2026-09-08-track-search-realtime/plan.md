# 노래 신청 검색·방 실시간 표시·친구 UI 통합 개선

## 범위와 기준
- 빈 입력: 자주 신청한 음악 8개. 제목: 300ms debounce YouTube 검색 8개. URL 선택 후 사연 유지.
- 계정별 캐시, 취소/IME/오류/키보드/portal 및 reduced motion 지원.
- 개인 큐 현재 entryId 중복 제거, 친구 상태 문구 복원, 프로필 300×431/240×344.8.
- 방 닉네임 이벤트 검증 및 최신 이름을 참가자/큐/프로필/세션/기존·추가 채팅에 반영.

## 선택 스킬
queuing-feature-delivery, queuing-orchestrator, queuing-api-boundary, queuing-ui-flow, frontend-architecture-guardrails, queuing-qa-reviewer, queuing-incident-curator, browser:control-in-app-browser.

## 커밋 순서
1. fix(room): 개인 큐 현재 곡 중복 제거 + 회귀 테스트
2. fix(follow): 친구 상태·프로필 치수와 패딩 소유권 + 테스트
3. feat(playlist): 음악 검색 콤보박스·공통 marquee·계정 캐시 + 테스트
4. fix(room): 닉네임 이벤트와 표시 동기화 + 테스트
5. docs(delivery): 통합 QA 및 전달 증거

## 검증
npm run lint, npm test, npm run build, 브라우저 시각 검증, 독립 read-only QA.

## 진행
- dev clean 시작. 백엔드 main Controller/DTO 계약 확인 완료.
- 네 기능 구현 및 기능별 코드·테스트 커밋 완료.
- 독립 QA의 ArrowUp/로그아웃 경합 지적 수정 후 재검토 pass.
- 최종 전체 713개 테스트(작업자 4개), lint, 단독 build 통과. 검증 중간 실패와 재실행은 qa-report.md 참조.
- 브라우저 runtime은 연결 없음(browsers.list=[]). 실계정/시각 검증 미실행을 명시하고 draft 전달.
- 계정 종료 지연 응답 incident 및 QA 재사용 규칙 기록.

