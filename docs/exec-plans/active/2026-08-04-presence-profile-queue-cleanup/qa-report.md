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
- 브라우저 자동화가 실행 환경의 sandbox metadata 오류로 시작되지 않아 presence 점/화살표와 모바일 줄임표의 픽셀 QA가 남아 있다.

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

## Track Title And Equalizer QA

- 판정: `pass` (fresh read-only reviewer, blocking finding 없음)
- targeted: 3 files / 6 tests pass
- full: 52 files / 126 tests pass
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- 두 카드가 기존 overflow-only marquee를 공유하고 신청자명/구분자는 고정되는지 확인했다.
- `PLAY` 문구 제거, 접근 가능한 3-bar equalizer, reduced-motion 정지 동작을 확인했다.
- PR head `73566a6`: GitHub Actions와 Vercel preview pass.

## Track Title And Equalizer Residual Risk

- 브라우저 연결 도구의 기존 sandbox metadata 오류 때문에 실제 썸네일 위 bar 대비/위치와 모바일 줄바꿈의 픽셀 QA는 수행하지 못했다.

## Equalizer Overlay QA

- 판정: `pass` (fresh read-only reviewer, blocking finding 없음)
- targeted: 1 file / 3 tests pass
- full: 52 files / 126 tests pass
- `npm run lint`, `npm run build`, `git diff --check`: pass
- `inset: 0`으로 썸네일 전체를 덮고 `rgba(255, 255, 255, 0.6)`와 `#3c3c3c`가 요청값과 일치하는지 확인했다.
- 기존 active-only 렌더링, 접근 가능한 이름, 막대 animation과 reduced-motion 정지 동작이 유지된다.
- 실제 썸네일별 합성 결과의 브라우저 픽셀 QA는 수행하지 못했다.
- overlay commit `07f0f32`: GitHub Actions와 Vercel preview pass.

## Bot Review Fix QA

- 판정: `pass` (fresh read-only reviewer, blocking finding 없음)
- targeted: 8 files / 18 tests pass
- relationship query-key/presence regression: 2 files / 2 tests pass
- full: 55 files / 135 tests pass
- `npm run lint`, `npm run build`, `git diff --check`: pass
- 전체 팔로잉 cursor pagination과 presence list updater 밖의 관계 cache key를 확인했다.
- 동시 unblock mutation state, invalidation Promise 대기, confetti abort/reset, 짧은 viewport scroll/텍스트 대비, test global cleanup을 확인했다.
- blocked DTO identity mapper와 이미 반영된 dual-lockfile nitpick은 코드 변경 없이 근거를 기록했다.
- 잔여 위험: 전용 관계 API가 없어 큰 팔로잉 계정의 첫 관계 확인 비용이 크고, 모달/confetti 실제 브라우저 QA는 수행하지 못했다.
- review fix `009eca3`: GitHub Actions, Vercel, CodeRabbit success. CodeRabbit actionable thread 7개가 자동 resolved됐다.

## Default Room Thumbnail QA

- 판정: `pass` (fresh read-only reviewer, blocking finding 없음)
- 다운로드 원본과 저장소 복사본 PNG 10장이 모두 byte-identical이고, `public/room-defaults`에는 새 파일 10장만 남았다.
- 기존 fallback 이미지 6개는 삭제됐고 런타임 경로 참조도 남지 않았다.
- targeted: 1 file / 4 tests pass
- full: 56 files / 139 tests pass
- `npm run lint`, `npm run build`, `git diff --check`: pass
- fallback seed의 10장 순환과 서버 thumbnail variant/url 우선순위 유지 여부를 확인했다.
- 사용자 소유 `CurrentRequesterCard.module.css` 변경은 이번 변경과 무관하므로 staging 대상에서 제외한다.
- 기능 commit `d89b007`과 문서 commit `54fbe36`을 push하고 새 Draft PR #33을 생성했다. 최종 implementation/docs head에서 GitHub Actions와 Vercel이 모두 통과했다.

## Default Thumbnail Surface Consistency QA

- 판정: `pass` (fresh read-only reviewer, blocking finding 없음)
- 원인은 기본 이미지 선택에만 존재했다. 업로드 thumbnail variant/url 우선순위는 유지되어 실제 방 이미지에는 영향이 없다.
- desktop lobby, mobile lobby, search hero, room interior 네 호출부가 모두 room slug를 fallback identity로 사용한다.
- 기존 방 내부의 slug 문자합 알고리즘을 그대로 공용 helper로 이동했으므로 방 내부의 기존 기본 이미지 배정은 유지된다.
- targeted: 1 file / 5 tests pass
- full: 56 files / 140 tests pass
- `npm run lint`, `npm run build`, `git diff --check`: pass
- 사용자 소유 `CurrentRequesterCard.module.css`는 unrelated/unstaged 상태다.
- v2 교체 commit `50a64e9`의 GitHub Actions, Vercel, CodeRabbit이 모두 통과했다.

## Recent V2 Thumbnail Replacement QA

- 판정: `pass` (fresh read-only reviewer, blocking finding 없음)
- Downloads의 2026-08-05 05:32:40 `*-v2.png` 10장과 저장소 복사본이 SHA-256 및 `cmp` 기준 모두 byte-identical하다.
- `public/room-defaults`에는 동일 basename의 v2 PNG 10장만 존재하며 모두 1254×1254 RGB PNG다.
- 구현과 테스트 fallback 목록은 v2 경로 10개만 사용하고 이전 이미지 경로는 남지 않았다.
- slug 기반 surface 일치와 서버 thumbnail variant/url 우선순위는 유지된다.
- targeted: 1 file / 5 tests pass
- full: 56 files / 140 tests pass
- `npm run lint`, `npm run build`, `git diff --check`: pass
- 사용자 소유 `CurrentRequesterCard.module.css`는 unrelated/unstaged 상태다.
