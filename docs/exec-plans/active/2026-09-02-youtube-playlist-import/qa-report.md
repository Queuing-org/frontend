# QA Report

## Result

- classification: pass
- blocking findings: none

## Boundary Review

- `watch?v=...&list=...`, `/playlist?list=...`, `youtu.be/...?...list=...`는 전체 URL과 `youtubePlaylist: true`로 변환한다.
- `list`가 없는 `watch?v=...`, `youtu.be/...`는 영상 ID와 `youtubePlaylist: false`를 유지한다.
- `list`가 존재하지만 값이나 경로가 잘못된 URL은 단일 영상으로 조용히 폴백하지 않는다.
- `useAddTrackForm`의 로컬 상태가 파싱 결과와 제출 가능 여부를 소유한다.
- `publishAddTrack`의 실제 STOMP body가 backend `QueueVideoRequest` 계약과 일치한다.
- 성공 후 room queue/playback invalidation과 오류 처리 흐름은 기존 동작을 유지한다.

## Verification

- targeted Vitest: 5 files / 28 tests pass
- `npm run lint`: pass
- `npm run test`: 155 files / 677 tests pass
- `npm run build`: pass
- `git diff --check`: pass
- fresh read-only reviewer: pass

## Residual Risk

- backend와 실제 YouTube API를 연결한 E2E는 수행하지 않았다.
- `https://www.youtube.com/watch&list=...`처럼 query 시작 문자인 `?`가 없는 URL은 표준 URL이 아니므로 거부한다.
- `/shorts/...?...list=...`와 embed/videoseries URL은 backend parser 계약 밖이라 지원하지 않는다.

## Follow-up QA: explicit playlist scope

- classification: pass
- blocking findings: none
- `watch?v=...&list=...`는 선택 전 request를 만들지 않고, 현재 영상 또는 재생목록 모드 선택을 payload에 반영한다.
- 순수 `/playlist?list=...`는 현재 영상 선택을 비활성화하고 재생목록 노래 추가를 명시적으로 선택해야 한다.
- URL 변경과 modal reset은 이전 선택을 초기화한다.
- `전체`라는 표현은 backend의 최대 두 페이지 계약과 다를 수 있어 `재생목록 노래도 함께 추가`로 교정했다.
- targeted 5 files / 39 tests, lint, full test 155 files / 688 tests, build, diff-check가 통과했다.
- 첫 full test의 범위 밖 virtualization timeout은 isolated 7/7과 두 번째 full 688/688 통과로 flaky임을 확인했다.
