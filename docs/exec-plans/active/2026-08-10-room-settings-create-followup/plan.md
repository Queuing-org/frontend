# 방·프로필 설정·방 생성 UI 후속 개선

## Scope

- 방 프로필 액션 높이·글자, 채팅 상단 페이드, 재생 equalizer 폭을 desktop·compact 비율에 맞춘다.
- 프로필 닉네임·한 줄 메시지를 단일 form과 mutation으로 저장하고 대상 필드에 2초 성공·실패 테두리를 제공한다.
- 방 생성의 최대 인원을 필수 선택으로 바꾸고 참여 제한을 비밀번호 입력과 메뉴를 합친 복합 컨트롤로 개편한다.
- 방문한 생성 단계 재진입은 중앙 `visitStep` 경로로 통일하고 입력값을 보존한다.
- 백엔드 API와 공용 payload 타입은 변경하지 않는다.
- `dev`에 로컬 커밋까지만 만들며 push와 PR 변경은 하지 않는다.

## Selected Skills

- `queuing-feature-delivery` (로컬 전달까지만 적용)
- `queuing-orchestrator`
- `queuing-ui-flow`
- `queuing-api-boundary`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership

- 방 시각 규칙: 기존 room profile/chat/queue CSS Modules
- 프로필 draft·mutation·타이머: `useProfileSettingsForm`; form DOM과 접근성: `ProfileSettingsForm`
- 방 생성 wizard 상태: `CreateRoomFormModal`; 세부 설정의 transient menu 상태: `CreateSettingsStep`
- 서버 상태: 기존 `useUpdateMe`, `useCreateRoom` mutation과 기존 query invalidation 유지

## Acceptance Criteria

- 방 상태/팔로우/관리 컨트롤은 28px·14px, compact 22.4px·11.2px다.
- 채팅 fade는 72px 레이어에서 64px 지점에 투명해지고 8px 투명 버퍼가 있으며 열린 메뉴가 위에 남는다.
- equalizer bar는 3px, compact 2.4px다.
- 프로필은 변경 조합별 단일 payload, 단일 완료 버튼, 고정 피드백 영역, 정확한 2초 필드 피드백과 IME Enter 차단을 제공한다.
- 방 생성 최대 인원은 `2~10`, `20~100` 10단위 중 반드시 선택한다.
- 참여 제한 메뉴는 화살표로만 열리고 바깥 클릭·Escape로 닫히며 공개 전환 중에도 비밀번호 draft를 보존한다.
- `1→2→3→2→3`, `1→2→3→1→3`에서 모든 입력값을 보존한다.

## Commit Slices

1. `style(room): 방 시각 개선`
2. `feat(settings): 설정 통합 저장`
3. `feat(room-create): 방 생성 입력 흐름`
4. `docs(delivery): 후속 UI 검증 기록`

## Progress

- [x] 요청, 아키텍처, 관련 스킬, 기존 run과 현재 worktree 확인
- [x] 방 시각 개선 구현·targeted verification·커밋
- [x] 설정 통합 저장 구현·targeted verification·커밋
- [x] 방 생성 입력 흐름 구현·targeted verification·커밋
- [x] lint, full test, build
- [ ] desktop·compact 시각 QA
- [x] fresh read-only QA
- [x] 검증 문서 커밋

## Verification

- targeted Vitest: settings hook/UI, room create, room profile/chat/queue 관련 테스트
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`
- 가능한 경우 브라우저에서 desktop·compact 시각/키보드 흐름 확인

## Result

- local QA: pass
- fresh read-only QA: pass after one bounded fix cycle and one race follow-up
- publication: intentionally skipped; no push and no PR mutation

## Residual Risk

- 연결 가능한 browser instance가 0개여 desktop·compact 실제 시각 QA는 수행하지 못했다. exact CSS 수치와 DOM/레이어는 정적으로 검토했고 상호작용은 자동화 테스트로 확인했다.
- 기본 병렬 full test는 마지막 검증에서 기존 queue/profile 테스트 2건이 5초 timeout을 냈다. 각 파일 격리 실행과 전체 single-worker 108개 파일/342개 테스트는 통과했다.
