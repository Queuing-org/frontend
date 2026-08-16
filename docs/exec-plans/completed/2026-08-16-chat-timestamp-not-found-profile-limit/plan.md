# 채팅 타임스탬프·404 상단 액션·최애곡 제한

## Scope

- 채팅의 `m:ss`, `h:mm:ss` 타임스탬프를 사이트 파란색 클릭 버튼으로 렌더링한다.
- 클릭한 사용자 플레이어만 해당 시점으로 이동하고 현재 곡이 바뀌면 방 재생 동기화로 복귀한다.
- 존재하지 않는 페이지 안내에 좌상단 로고와 방 검색 버튼을 표시한다.
- 설정의 `한 줄 메시지`를 `최애곡`으로 바꾸고 입력을 20자로 제한하며 입력 우측에 `{length}/20`을 표시한다.
- 기존 PR #49가 작업 중 병합되어 동일 `dev` head의 새 Draft PR #50으로 전달한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-ui-flow`
- `queuing-api-boundary`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership Decisions

- 타임스탬프 파싱은 room chat model의 순수 함수가 소유한다.
- 채팅 행은 파싱 결과의 렌더링과 클릭 callback만 소유한다.
- 현재 곡별 로컬 seek 요청은 `RoomPlaybackScreen`이 소유한다.
- YouTube hook은 로컬 seek가 활성화된 현재 영상에서만 서버 위치 보정을 생략하고 재생/일시정지 상태는 계속 따른다.
- 최애곡 20자 정규화와 저장 payload 제한은 `useProfileSettingsForm`이 소유하고, 카운터 배치는 설정 form이 소유한다.

## Commit Slices

1. `feat(room): 채팅 타임스탬프 로컬 이동 추가`
2. `fix(ui): 404 상단 액션과 최애곡 입력 정비`
3. `docs(delivery): 채팅 타임스탬프 후속 검증 기록`

## Verification

- 관련 parser/player/chat/settings/not-found 기존 및 신규 테스트
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`

## Progress

- [x] 요청·브랜치·기존 로컬 커밋 확인
- [x] 상태/API/UI 경계 결정
- [x] 구현
- [x] 자동 검증
- [x] fresh QA review
- [x] 커밋 및 Draft PR #50 게시

## Residual Risk

- 로컬 seek 이후에는 현재 곡이 바뀔 때까지 서버의 시간 위치 보정만 무시하므로 같은 방의 다른 참가자와 재생 시점이 달라진다. 이는 최신 사용자 요청의 의도된 동작이다.
- 로컬 seek 뒤 viewport 경계를 넘겨 플레이어가 재마운트되면 최초 클릭 지점에서 다시 시작할 수 있다. 일반 재생 흐름에는 영향이 없는 희귀 반응형 전환 경계다.
