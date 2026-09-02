# YouTube 재생목록 신청 연결

## Scope

- 노래 신청 URL을 단일 영상과 YouTube 재생목록으로 구분한다.
- 재생목록 URL은 원본 URL과 `youtubePlaylist: true`를 WebSocket payload로 전달한다.
- 단일 영상은 기존처럼 영상 ID와 `youtubePlaylist: false`를 전달한다.
- 노래 신청 UI에서 영상과 재생목록을 모두 지원한다고 안내한다.

## Acceptance Criteria

- `watch?v=...&list=...`는 현재 영상 한 곡이 아니라 재생목록으로 요청한다.
- `playlist?list=...`와 `youtu.be/...?...list=...`도 재생목록으로 요청한다.
- `list`가 없는 `watch?v=...`와 `youtu.be/...`는 단일 영상으로 유지한다.
- 비 YouTube URL과 비어 있거나 잘못된 `list`는 제출하지 않는다.
- 기존 성공·오류·캐시 갱신 흐름은 유지한다.

## Selected Skills

- queuing-feature-delivery
- queuing-pr-review-cycle
- queuing-api-boundary
- queuing-ui-flow
- frontend-architecture-guardrails
- queuing-qa-reviewer

## API Contract

- destination: `/app/room/{roomSlug}/playlist`
- 단일 영상: `{ videoId: string, youtubePlaylist: false, story: string | null }`
- 재생목록: `{ videoId: fullYoutubeUrl, youtubePlaylist: true, story: string | null }`
- backend source: `QueueVideoRequest.youtubePlaylist`, `YoutubePlaylistUrlParser`

## Commit Slices

1. `fix(playlist): 유튜브 재생목록 신청을 백엔드에 전달`
2. `docs(delivery): 재생목록 신청 게시 결과를 기록`

## Progress

- [x] frontend 입력 파서와 WebSocket payload 확인
- [x] backend `youtubePlaylist` 계약 확인
- [x] URL 판별·payload·안내 문구 구현
- [x] targeted/full local verification
- [x] fresh read-only QA
- [x] feature commit (`d0915a2`)
- [x] docs commit, push, Draft PR #60 게시

## Verification

- add-track model/hook/API targeted Vitest
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`

결과:

- targeted Vitest: 5 files / 28 tests pass
- lint: pass
- full test: 155 files / 677 tests pass
- build: pass
- git diff --check: pass
- fresh read-only QA: pass, blocker 없음

## Residual Risk

- 실제 YouTube 재생목록 조회 성공 여부와 최대 수집 범위는 backend와 YouTube 응답에 의존한다.
- `watch&list=...`처럼 `?`가 없는 비표준 URL과 `/shorts/...?...list=...`는 지원하지 않는다.

## Follow-up: explicit playlist scope

- [x] 사용자 후속 요구를 actionable finding으로 분류
- [x] 재생목록 감지 시 현재 영상/재생목록 노래 함께 추가 선택 UI 제공
- [x] 순수 재생목록 URL의 노래 추가 명시 선택과 제약 안내
- [x] targeted/full verification 및 structured QA
- [x] 후속 feature commit (`5b21b8c`)
- [x] delivery docs commit과 Draft PR #60 push

후속 검증 결과:

- targeted Vitest: 5 files / 39 tests pass
- lint: pass
- full test 1차: 687/688 pass, 범위 밖 queue virtualization test 5초 timeout
- queue virtualization isolated rerun: 7/7 pass
- full test 2차: 155 files / 688 tests pass
- build: pass
- git diff --check: pass
- structured QA: pass, blocker 없음
