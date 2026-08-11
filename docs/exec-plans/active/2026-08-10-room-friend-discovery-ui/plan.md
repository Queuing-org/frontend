# 방 내부·친구·탐색 UI 개선

## Scope

- 방 내부 채팅·참가자·재생목록의 스크롤바를 숨기고 기존 스크롤·가상화 동작을 유지한다.
- 채팅 하단 정렬, 상단 페이드, 메시지 hover와 관리 드롭다운 시각·레이어를 정리한다.
- FOLLOW 카드 선택 시 공통 공개 프로필 본문을 사용하는 중첩 상세 모달을 제공한다.
- CREATE·FOLLOW·SETTING 중 탐색 컨트롤의 방 종속 액션을 잠그고 헤더 위치를 안정화한다.
- 방 생성 단계 재방문과 입력값 보존을 지원한다.
- 썸네일 업로드·방 생성/수정·프로필 수정 오류에서 HTTP 상태 코드를 숨긴다.
- backend API 계약은 변경하지 않는다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-ui-flow`
- `queuing-api-boundary`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`
- `github:yeet`

## Ownership

- 방 목록 스크롤·채팅 상호작용: `src/features/room/chat`, `participants`, `queue`
- 공개 프로필 본문: `src/features/user/profile`이 공개 프로필 표현을 소유하고 room/follow가 조합한다.
- FOLLOW 중첩 모달 선택 상태·포커스 복원: `FollowModal`
- 탐색 컨트롤 잠금·헤더 안정화: room discovery dock과 home/search 화면
- 방 생성 wizard: `RoomFormModal` 로컬 상태
- 오류 문구: 각 기능의 소비 UI, `ApiError.status/code` 내부 분기는 유지

## Acceptance Criteria

- 채팅·참가자·재생목록은 스크롤바만 보이지 않고 휠·터치·키보드 스크롤과 큐 가상화가 유지된다.
- 짧은 채팅은 아래에서 시작하고 긴 목록, 이전 이력 prepend, 새 메시지 자동 스크롤 동작이 유지된다.
- 채팅 상단 64px 페이드, hover 배경, 중앙 정렬 드롭다운과 통일된 그림자가 적용되고 열린 메뉴가 페이드 위에 표시된다.
- FOLLOW 카드 하단 액션이 사라지고 카드 선택으로 300×380 계열 중첩 프로필이 열린다.
- 중첩 프로필은 공개 정보, 팔로우/언팔로우, 차단을 제공하고 닫힐 때 원래 카드로 포커스를 돌린다.
- 차단 성공 시 상세가 닫히고 팔로우 관계 캐시가 갱신된다.
- CREATE·FOLLOW·SETTING 동안 좌우/입장 방 액션만 잠기고 MENU·FILTER 및 모바일 빠른 메뉴는 기존대로 동작한다.
- 일반/compact 홈 상단 행이 로그인 버튼 최소 높이를 유지한다.
- 생성 단계는 방문한 단계까지 재클릭할 수 있고 모든 폼 값이 유지된다.
- 대상 사용자 오류 문구에 숫자 HTTP 상태 코드가 노출되지 않는다.

## Commit Slices

1. `style(room): 내부 목록과 채팅 피드백 정리`
2. `feat(follow): 중첩 공개 프로필 상세 추가`
3. `fix(discovery): 모달 탐색 잠금과 생성 단계 복원`
4. `fix(feedback): 사용자 오류에서 상태 코드 제거`
5. `docs(delivery): UI 개선 검증과 구조 기록`

## Progress

- [x] 요청, 아키텍처, 관련 스킬과 기존 PR 범위 확인
- [x] 구현
- [x] targeted tests
- [x] lint, full test, build
- [ ] desktop, compact, mobile visual QA (연결 가능한 브라우저가 없어 미수행)
- [x] fresh QA review
- [x] feature commits, dev push, new Draft PR #44 (PR #43 was already merged before publication)

## Residual Risk

- PR #43은 2026-08-10에 이미 merge되어 갱신할 수 없어 동일한 `dev` 브랜치의 후속 변경을 Draft PR #44로 게시했다.
- 연결 가능한 브라우저 인스턴스가 없어 desktop/compact/mobile 실제 조작·시각 QA는 자동화 테스트와 정적 검토로 대체했으며, PR에서 수동 확인이 필요하다.
