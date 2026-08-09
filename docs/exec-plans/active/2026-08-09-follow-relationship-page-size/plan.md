# 팔로워 관계 조회 페이지 크기 수정

## 요청

- 팔로워 카드를 펼쳤을 때 `확인 실패`가 표시되는 문제를 수정한다.
- 기존 미커밋 팔로우 UI 변경은 보존하고 이번 커밋에 포함하지 않는다.

## 원인

- 프론트는 `GET /api/v1/follows/followings`에 `size=200`을 보낸다.
- 현재 Queuing OpenAPI 계약은 `size`를 1개부터 100개까지 허용한다.
- 관계 조회 Query가 실패하면서 팔로우 액션이 `확인 실패` 비활성 상태가 된다.

## 범위

- 관계 확인용 전체 팔로잉 조회의 page size를 100으로 낮춘다.
- 다음 cursor page에도 동일한 page size가 적용되는지 테스트한다.
- 잘못 기록된 기존 API 계약 문서를 정정한다.
- 사용자 소유의 기존 팔로우 UI 변경은 수정하거나 stage하지 않는다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 커밋 계획

1. `fix(follow): 팔로워 관계 조회 크기 계약 수정`
   - API page size와 회귀 테스트
   - API 계약 및 실행 기록

## 검증

- [x] 관계 조회 타깃 테스트: 3 files / 6 tests pass
- [x] `npm run lint`
- [x] `npm run test`: 66 files / 178 tests pass
- [x] `npm run build`
- [x] `git diff --check`
- [x] QA reviewer 판정 `pass`

## 잔여 위험

- 로그인된 브라우저 세션이 없어 실제 팔로워 카드 수동 재현은 로컬 자동화로 확인하지 못할 수 있다.
- 단일 관계 API가 없어 첫 조회 시 전체 팔로잉 cursor page를 순회하는 기존 비용은 유지된다.
