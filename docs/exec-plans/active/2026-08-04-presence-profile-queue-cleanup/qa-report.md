# QA Report

## Result

- 판정: `pass`
- fresh reviewer의 첫 판정은 `fix`였고 대표 칭호 변경 시 공개 profile cache 누락과 DELETE `result: false` 처리 누락을 수정한 뒤 재검토를 통과했다.

## Verification

- follow targeted: 3 files / 5 tests pass
- profile/settings/badge targeted: 최종 3 files / 11 tests pass
- queue targeted: 5 files / 14 tests pass
- `npm run lint`: pass
- `npm run test`: 46 files / 113 tests pass
- `npm run build`: pass
- `git diff --check`: pass
- 로컬 `/home`: HTTP 200

## Boundary Review

- follower/following은 공용 카드이며 room text와 navigation action이 분리됐다.
- 음악력 PUT-only UI와 `myVote` 실시간 cache 계약이 충돌하지 않는다.
- badge set/clear가 동일한 네 cache 경계를 무효화한다.
- history 참조는 API, query, type, UI, realtime에서 제거됐다.
- playback current entry는 전체 queue에만 합쳐지며 active 항목은 reorder/delete에서 제외된다.

## Residual Risk

- live backend에서 음악력 1시간 제한 오류와 대표 칭호 DELETE를 직접 실행하지 않았다.
- 브라우저 자동화가 실행 환경의 sandbox metadata 오류로 시작되지 않아 presence 점/화살표, 모바일 줄임표, `PLAY` 배치의 픽셀 QA가 남아 있다.

## Follow-up QA

- 판정: `pass` (fresh read-only reviewer, blocking finding 없음)
- targeted: 9 files / 23 tests pass
- full: 51 files / 125 tests pass
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- 차단 API 첫/다음 page params, DELETE boolean 검증, follow/search cache 무효화를 확인했다.
- 공용 follow card의 확장 버튼과 방 링크 분리, blocked card의 presence 제거, 사연 overflow-only 동작, badge 순차 모달/confetti 실패 격리를 확인했다.

## Follow-up Residual Risk

- 브라우저 연결 도구가 sandbox metadata 오류로 시작되지 않아 marquee 속도/방향과 confetti layer의 pixel QA는 수행하지 못했다.
- follower 관계 판별은 기존 `useFollowingRelationship`의 최대 200명 단일 조회를 사용한다. 200명 초과 계정의 완전한 정확성은 전용 관계 API 또는 cursor pagination 정책이 필요하다.
- badge dialog는 기존과 동일하게 초기 focus와 Escape/backdrop close를 보장하지만 완전한 focus trap은 제공하지 않는다.

## Vercel Lockfile Fix

- 첫 후속 push의 GitHub Actions는 success였지만 Vercel은 `ERR_PNPM_OUTDATED_LOCKFILE`로 dependency install 전에 실패했다.
- 원인: `canvas-confetti` 추가 시 `package.json`과 `package-lock.json`만 갱신하고 추적 중인 `pnpm-lock.yaml`을 누락했다.
- 수정: `pnpm install --lockfile-only`로 동기화하고 `pnpm install --frozen-lockfile` 통과를 확인했다.
- pnpm install 이후 final gate: lint pass, 51 files / 125 tests pass, build pass.
- fix commit `caf7669`: GitHub Actions와 Vercel preview 모두 pass.
- durable incident: `docs/agent-harness/incidents/2026-08-04-dual-lockfile-vercel-failure.md`
