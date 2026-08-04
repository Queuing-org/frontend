# 설정 칭호 및 프로필 수정 계약 정정

## Scope

- 설정 페이지의 칭호 목록과 대표 칭호를 `GET /api/v1/users/me/badges` 응답만으로 구성한다.
- `PATCH /api/v1/user-profiles/me`의 필수 `nickname`과 boolean 응답 계약을 반영한다.
- 닉네임과 한 줄 메시지를 각각 오른쪽 `수정` 버튼으로 독립 저장한다.
- 대표 칭호 변경 mutation과 기존 공개/내 칭호 캐시 갱신 동작은 유지한다.

## Acceptance Criteria

- 설정 페이지의 칭호 옵션에는 `/api/v1/users/me/badges`가 반환한 획득 칭호만 표시한다.
- 현재 대표 칭호는 같은 응답의 `representativeBadge`로 표시한다.
- 현재 대표 칭호가 선택값으로 표시되고 변경 시 `{ badgeCode }`가 전송된다.
- 한 줄 메시지만 수정해도 현재 닉네임을 payload에 포함한다.
- 프로필 수정 성공 응답 `true`를 사용자 객체로 캐시에 저장하지 않고 내 정보를 재검증한다.
- 닉네임과 한 줄 메시지의 수정 버튼 및 submit 경로를 분리한다.

## Selected Skills

- queuing-feature-delivery
- queuing-pr-review-cycle
- queuing-api-boundary
- queuing-ui-flow
- frontend-architecture-guardrails
- queuing-qa-reviewer

## Commit Slices

1. `feat(settings): 칭호와 프로필 수정 계약을 정정`

## Progress

- [x] 브랜치 생성 및 기존 데이터 흐름 확인
- [x] 설정 칭호 데이터 흐름 전환
- [x] 대상 테스트 및 전체 검증
- [x] fresh QA review
- [x] commit, push, Draft PR
- [x] 사용자 계약 정정 구현
- [x] 정정 후 전체 검증 및 fresh QA
- [ ] PR #31 update

## Verification

- targeted Vitest
- `npm run lint`
- `npm run test`
- `npm run build`

결과:

- targeted Vitest: 6 files / 14 tests pass
- lint: pass
- full test: 46 files / 108 tests pass
- build: pass
- fresh QA: pass

## Residual Risk

- 실제 로그인 브라우저에서 획득 칭호 조회, 대표 칭호 변경, 닉네임/한 줄 메시지 독립 저장은 수동 QA 대상이다.
