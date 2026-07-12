# 프로필 통계·음악력·채팅 신고/차단

## 범위

- 하네스에 기능 단위 한국어 Conventional Commit 정책을 추가한다.
- Vitest와 Testing Library 기반 프론트 테스트 환경을 구성한다.
- 공개/내 프로필의 큐잉 횟수와 음악력을 실제 API 데이터로 표시한다.
- 음악력 추천, 사용자 차단, 채팅 메시지 신고 API와 React Query 경계를 구현한다.
- `ChatArea`에 접근 가능한 메시지 관리 메뉴와 신고/차단 모달을 연결한다.
- lint, test, build, 독립 QA를 통과한 뒤 기능별 커밋을 push하고 Draft PR을 연다.

## 선택 스킬

- `queuing-feature-delivery`: 브랜치, 커밋, 검증, Draft PR 소유
- `queuing-orchestrator`: API/UI/QA 경계 통합
- `queuing-api-boundary`: API 응답, mutation, query cache 계약
- `queuing-ui-flow`: 프로필, 채팅 메뉴, 모달 상호작용
- `frontend-architecture-guardrails`: feature 소유권, 서버/로컬 상태 분리, 테스트 가능 로직
- `queuing-qa-reviewer`: 최종 독립 경계 리뷰
- `github:yeet`: scoped stage/push/Draft PR 발행

## 기능 커밋 계획

1. `chore: 기능 단위 한국어 커밋 정책 추가`
2. `test: 프론트 컴포넌트 테스트 환경 추가`
3. `feat: 프로필 음악력과 큐잉 통계 표시`
4. `feat: 사용자 차단 기능 추가`
5. `feat: 채팅 메시지 신고 기능 추가`
6. `feat: 채팅 메시지 관리 메뉴 연결`

코드와 해당 동작 테스트는 같은 기능 커밋에 포함한다. 각 커밋 전 관련 테스트를 실행하고 PR 전 `npm run lint`, `npm run test`, `npm run build`를 실행한다.

## 수용 기준

- 통계 누락은 `-`로 보이고 이용 시간은 어디에도 표시되지 않는다.
- 타 사용자만 음악력 추천 가능하며 추천 성공 시 음악력/공개 프로필 캐시가 동기화된다.
- 차단은 확인, 요청 중 잠금, 성공 완료 화면, 실패 인라인 오류를 제공하고 관련 검색/팔로우 캐시를 무효화한다.
- 신고는 네 사유 다중 선택, 표시 순서 줄바꿈 payload, 성공 닫기, 실패 선택 유지가 동작한다.
- 메시지 식별자/작성자 유형별 메뉴 노출 규칙과 바깥 클릭/Escape/스크롤 닫힘, 포커스 복원이 동작한다.
- CI가 `npm ci -> lint -> test -> build` 순서로 실행된다.

## 진행

- [x] 브랜치 생성
- [x] 커밋 정책 반영
- [x] 테스트 환경 구성
- [x] 프로필 통계/음악력
- [ ] 차단
- [ ] 신고
- [ ] 채팅 관리 메뉴
- [ ] 전체 검증 및 독립 QA
- [ ] push 및 Draft PR

## 결정

- 서버 상태는 React Query, 메뉴/모달의 일시 상태는 가장 가까운 컴포넌트 로컬 상태가 소유한다.
- 새 최상위 계층은 만들지 않고 기존 `user`, `follow`, `room/chat`, `settings` feature 경계를 따른다.
- 서버 배포 지연을 감안해 프로필 통계 필드는 선택 값으로 유지한다.

## 잔여 위험

- 계획에 제시된 신규 API 계약은 실제 서버 응답 증거가 없으므로 타입/클라이언트 계약에 기반해 구현하고 PR에 명시한다.
