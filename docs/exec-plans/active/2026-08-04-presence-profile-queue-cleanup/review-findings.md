# Review Findings

## Context

- PR: `#32`
- reviewed head: `0079246`
- unresolved, non-outdated inline threads: 9
- source: GitHub App의 thread-aware GraphQL review thread 목록
- CLI token은 만료됐지만 GitHub App read가 thread resolution metadata를 제공하므로 분류는 계속 진행한다.

## Actionable

1. `FollowUserActions` / `useFollowingRelationship`의 200명 단일 page 조회
   - Codex P2와 CodeRabbit Major는 같은 결함의 중복 thread다.
   - `hasNext/nextCursor`를 끝까지 따라 전체 팔로잉을 한 query cache로 조회하고 target slug를 select한다.
   - presence list updater가 raw page로 오인하지 않도록 관계 전용 query key는 `followingsRoot` 밖에 둔다.
   - 실행 계획의 200명 잔여 위험 thread는 같은 수정으로 제거한다.
2. `badgeAwardConfetti` abort 후 실행 중 particle 잔존
   - modal-scoped `confetti.create()` 인스턴스를 만들고 abort에 `reset`을 연결한다.
3. `BadgeAwardModal` 짧은 viewport 완료 버튼 접근 불가
   - viewport 최대 높이와 세로 scroll을 추가한다.
4. `BadgeAwardModal` 13px 설명 문구 대비 부족
   - 기존 간격/타이포를 유지하고 `#62626f`로 어둡게 한다.
5. `useUnblockUser` invalidation Promise 폐기
   - 두 invalidation을 `Promise.all`로 반환해 refetch 완료까지 mutation pending을 유지한다.
6. `BlockedUsersList` 동시 mutation의 latest variables만 표시
   - mutation cache의 모든 pending unblock slug를 읽어 각 카드를 독립적으로 비활성화한다.
7. `OverflowMarquee.test` global `ResizeObserver` stub 누수
   - `afterEach`에서 `vi.unstubAllGlobals()`를 호출한다.

## Duplicate

- 실행 계획의 200명 제한 thread는 관계 pagination 코드 thread와 같은 원인이다.
- Codex와 CodeRabbit의 `FollowUserActions` thread는 같은 코드 수정으로 처리한다.

## Already Addressed / Skip

- dual lockfile nitpick: delivery skill에 `pnpm install --frozen-lockfile` gate가 있고 두 dependency가 두 tracked lockfile에 모두 존재한다.
- blocked DTO/domain 분리 nitpick: wire와 domain shape가 동일하고 별도 변환 규칙이 없어 현재는 identity mapper만 늘어난다. 계약이 달라질 때 mapper를 도입한다.

## GitHub Write Boundary

- 사용자는 수정·commit·push를 승인했다.
- review reply, thread resolve, review submit, ready 전환, merge는 수행하지 않는다.

## Verification

- targeted: 8 files / 18 tests pass
- query-key/presence regression targeted: 2 files / 2 tests pass
- full: 55 files / 135 tests pass
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- fresh read-only QA: `pass`, blocking finding 없음

## Residual Risk

- 단일 관계 조회 API가 없어 첫 관계 확인은 전체 팔로잉 page를 모은다. 정확성은 보장하지만 팔로잉이 매우 큰 계정은 전용 관계 API보다 요청 비용이 크다.
- 실제 짧은 모바일 landscape와 confetti canvas cleanup은 브라우저 픽셀/런타임 QA를 수행하지 못했다.

## Post-push State

- fix commit: `009eca3`
- GitHub Actions: success
- Vercel: success
- CodeRabbit: success; actionable CodeRabbit thread 7개 자동 resolved
- outdated unresolved plan thread: 1
- live unresolved Codex thread: 1, CodeRabbit의 같은 관계 pagination thread와 중복이며 코드는 수정 완료
- 사용자 요청에 thread resolve 권한은 포함되지 않아 직접 resolve하지 않았다.

## PR #33 Default Thumbnail Consistency

### Actionable

- 사용자 재현: 기본 썸네일 방의 로비 이미지와 방 내부 이미지가 서로 다르다.
- 원인: desktop/mobile lobby와 search hero는 목록 index를 fallback seed로 사용하지만 방 내부는 room slug 문자 합을 사용한다. 업로드 이미지 URL이 있으면 fallback이 실행되지 않으므로 기본 썸네일 방에만 발생한다.
- 수정: fallback 선택 API가 목록 위치를 받지 않고 room slug를 직접 받도록 바꾸고 모든 화면을 같은 slug 기반 선택으로 통일한다.

### Verification Plan

- 같은 room slug가 로비, 검색, 방 내부에서 같은 fallback path를 반환하는 단위 테스트
- targeted test, full test, lint, build, diff-check, fresh read-only QA
