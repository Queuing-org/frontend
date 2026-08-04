# 설정 칭호 카탈로그 전환

## Scope

- 설정 페이지의 칭호 목록과 획득 여부를 `GET /api/v1/badges` 응답만으로 구성한다.
- 현재 대표 칭호는 로그인 사용자 응답의 `representativeBadge`를 사용한다.
- 대표 칭호 변경 mutation과 기존 공개/내 칭호 캐시 갱신 동작은 유지한다.

## Acceptance Criteria

- 설정 페이지 진입 시 칭호 목록 때문에 `/api/v1/users/me/badges`를 조회하지 않는다.
- 카탈로그의 `acquired: true` 칭호만 선택할 수 있다.
- 카탈로그 순서 안에서 획득 칭호가 먼저 표시되는 기존 UI 동작을 유지한다.
- 현재 대표 칭호가 선택값으로 표시되고 변경 시 `{ badgeCode }`가 전송된다.

## Selected Skills

- queuing-feature-delivery
- queuing-api-boundary
- queuing-ui-flow
- frontend-architecture-guardrails
- queuing-qa-reviewer

## Commit Slices

1. `feat(settings): 칭호 목록을 카탈로그 API 기준으로 전환`

## Progress

- [x] 브랜치 생성 및 기존 데이터 흐름 확인
- [x] 설정 칭호 데이터 흐름 전환
- [x] 대상 테스트 및 전체 검증
- [x] fresh QA review
- [ ] commit, push, Draft PR

## Verification

- targeted Vitest
- `npm run lint`
- `npm run test`
- `npm run build`

결과:

- targeted Vitest: 2 files / 5 tests pass
- lint: pass
- full test: 43 files / 102 tests pass
- build: pass
- fresh QA: pass

## Residual Risk

- 백엔드가 로그인 쿠키를 인식하지 못하면 카탈로그의 `acquired`가 모두 false가 되므로 실제 배포 환경의 세션 쿠키 전달은 수동 QA 대상이다.
