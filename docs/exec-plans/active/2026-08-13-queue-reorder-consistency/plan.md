# 연속 큐 순서 변경 일관성 수정

## 상태

- ci-pending
- 브랜치: `dev`

## 요청

- 전체 트랙에서 순서를 연속 변경하면 항목 데이터는 남지만 목록에서 시각적으로 사라지는 현상을 수정한다.
- 사라진 항목은 보이지 않는 위치에서 드래그할 때 잠시 나타나는 상태도 제거한다.
- 동일한 오류 상태에서 `내 신청곡` 탭의 순서 변경이 반영되지 않는 문제를 함께 수정한다.

## 조사 가설

- 연속 mutation의 optimistic snapshot/rollback 또는 invalidation 완료 순서가 최신 캐시를 이전 상태로 덮을 수 있다.
- sortable의 로컬 optimistic order와 infinite-query entry order가 mutation pending 동안 서로 다른 기준을 사용할 수 있다.
- 가상화 render window가 오래된 index/측정값을 유지하면 데이터가 있어도 DOM에서 빠질 수 있다.

## 수용 조건

- 이전 순서 변경 응답을 기다리지 않고 여러 번 이동해도 최신 화면 순서와 전체 항목 수가 유지된다.
- mutation 성공/실패/무효화가 겹쳐도 이전 snapshot이 후속 이동을 덮지 않는다.
- 전체 트랙과 내 신청곡 탭이 각자의 query key 및 API 계약에 맞는 최종 순서를 표시한다.
- drag 종료·취소 뒤 가상화 목록에 유령 공백이나 overlay 전용 항목이 남지 않는다.

## 선택한 기술 경로

- `queuing-feature-delivery`: dev 기반 커밋·QA·Draft PR 전달
- `queuing-orchestrator`: drag/UI/query mutation 경계 조율
- `queuing-ui-flow`: sortable 및 가상화 상태 검증
- `queuing-api-boundary`: move payload, optimistic cache, invalidation 검증
- `frontend-architecture-guardrails`: query 상태와 transient drag 상태 소유권 유지
- `queuing-qa-reviewer`: 연속 mutation과 두 탭 회귀 검토
- `queuing-incident-curator`: 실제 녹화로 확인된 DnD 원본 노드 가시성 재발 교훈 기록

## 진행

- [x] 현재 reorder와 가상화 흐름 재현 테스트 작성
- [x] 원인 수정 및 전체/내 신청곡 연속 이동 고정
- [x] targeted, lint, full test, build
- [x] fresh read-only QA
- [x] 실제 녹화 프레임 기준 잔존 원본 카드 가시성 수정
- [x] 추가 targeted, lint, full test, build, fresh QA
- [x] 추가 커밋, GitHub 재인증 후 push, Draft PR #48

## 예정 커밋

1. `fix(queue): 연속 순서 변경 일관성 보장`
2. `docs(delivery): 큐 순서 변경 검증 기록`
3. `fix(queue): 드래그 원본 카드 가시성 보장`
4. `docs(incident): 큐 드래그 가시성 재발 기록`
