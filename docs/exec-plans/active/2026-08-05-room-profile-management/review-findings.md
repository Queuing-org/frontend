# Review Findings

## Context

- PR: `#33`
- reviewed head: `ed36dca`
- unresolved, non-outdated inline threads: 3
- source: GitHub GraphQL review thread 목록
- current checks: GitHub Actions, Vercel, CodeRabbit success

## Actionable

1. `RoomProfilePanel.module.css` 음악력 버튼 위치 단위 누락
   - `bottom: 28`은 0이 아닌 CSS 길이에 단위가 없어 브라우저가 선언을 폐기한다.
   - `28px`로 수정한다.
2. 현재 방을 나간 신청자에게 내보내기 노출
   - playback의 신청자 정보는 참가자 퇴장 후에도 남을 수 있다.
   - 현재 `participants`에서 동일 `userSlug`를 찾고 참가자 kick target이 있을 때만 내보내기를 노출·실행한다.
3. 프로필 차단 성공이 현재 채팅에 전파되지 않음
   - 채팅 내부 차단 sender 상태를 방 화면의 공통 소유자로 올린다.
   - 채팅과 프로필 차단 성공이 같은 callback을 사용하고, 이미 로드된 해당 사용자의 메시지를 즉시 숨긴다.

## Agent Guidance

- 루트 `AGENTS.md`에 Codex의 GitHub PR 리뷰 요약, 인라인 코멘트, 리뷰 답변을 기본적으로 한국어로 작성하는 규칙을 추가한다.

## GitHub Write Boundary

- 사용자는 타당한 리뷰 수정과 commit/push를 승인했다.
- 리뷰 답변, thread resolve, review submit, ready 전환, merge는 수행하지 않는다.

## Verification

- targeted: 프로필, 채팅, 참가자 identity 3 files / 24 tests pass
- full: 57 files / 155 tests pass
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- structured boundary QA: pass, blocking finding 없음

## QA Boundary Result

- 음악력 action offset은 desktop `28px`, 기존 mobile override `1rem`을 사용한다.
- 내보내기 target은 현재 참가자 목록의 공개 `userSlug`로 만든 target만 사용한다.
- 차단 sender set은 `RoomPlaybackJoinedContent`가 소유하고 mobile/desktop chat과 profile block entry point가 공유한다.
- 차단 API와 kick API payload/header 계약은 변경하지 않았다.

## Post-push State

- review fix commit: `86dc02e`
- Korean review guidance commit: `999b2b0`
- GitHub Actions: success
- Vercel: success
- CodeRabbit: success
- CSS 단위와 kick gate thread는 최신 diff에서 outdated다.
- 차단 상태 전파 thread는 live unresolved지만 최신 코드와 테스트에서 수정 완료했다.
- 사용자 요청에 thread resolve 권한은 포함되지 않아 직접 resolve하지 않았다.
