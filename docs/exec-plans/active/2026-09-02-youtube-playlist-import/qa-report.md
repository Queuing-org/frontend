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
