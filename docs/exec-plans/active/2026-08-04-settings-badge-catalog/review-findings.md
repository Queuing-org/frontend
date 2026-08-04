# Review Findings

## Context

- PR: https://github.com/Queuing-org/frontend/pull/31
- GitHub Actions/Vercel: pass on `242e190`
- unresolved review threads: none
- source: 사용자가 채팅에서 API 계약과 UI 요구를 정정함

## Actionable

1. 설정 칭호 목록과 대표 칭호의 단일 소스를 `GET /api/v1/users/me/badges`로 변경한다.
2. 프로필 수정 payload에 `nickname`을 필수로 포함하고 response를 boolean으로 처리한다.
3. 닉네임과 한 줄 메시지에 각각 오른쪽 `수정` 버튼과 독립 submit 경로를 제공한다.

## Resolved / Duplicate / Conflict

- 공개 프로필 캐시 무효화 누락: `useUpdateMe` 성공 시 `me`와 현재 slug의 공개 프로필을 함께 무효화하고 테스트함.
- 계정 전환 시 내 칭호 캐시 잔존: 로그아웃 성공 시 `badgeKeys.me()`를 제거하고 테스트함.

## External Checks

- CodeRabbit: Draft라 review skipped, status success.
- Vercel: success.

## QA

- fresh read-only QA: pass
- blockers: none
