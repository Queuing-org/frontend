# QA Report

## Result

- classification: pass
- blocking findings: none

## Boundary Review

- 설정 칭호 목록과 선택 가능 여부는 `GET /api/v1/badges`의 `badges[].acquired`만 사용한다.
- 설정 페이지에서 목록 구성을 위한 `/api/v1/users/me/badges` 조회를 제거했다.
- 현재 대표 칭호는 기존 로그인 사용자 계약의 `representativeBadge`를 사용한다.
- 대표 칭호 변경 성공 시 `userKeys.me()`를 재검증하므로 controlled select가 최신 대표값으로 동기화된다.
- 삭제한 획득 칭호 병합 helper의 남은 사용처가 없다.

## Verification

- `npm run test -- src/features/settings/ui/ProfileSettingsTab.test.tsx src/features/badge/api/badges.test.ts`: 2 files / 5 tests pass
- `npm run lint`: pass
- `npm run test`: 43 files / 102 tests pass
- `npm run build`: pass
- `git diff --check`: pass
- fresh read-only QA: pass

## Residual Risk

- 실제 로그인 브라우저에서 세션 쿠키와 함께 `/api/v1/badges`가 `acquired: true`를 반환하는 수동 확인은 수행하지 않았다.
