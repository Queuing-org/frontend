# QA Report

## 결과

- verdict: pass
- fresh read-only review: query fix pass; video follow-up re-review pass
- browser pointer-drag QA: unavailable

## 자동 검증

- targeted queue/query tests: 8 files, 21 tests passed
- `npm run test`: 118 files, 399 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

## 핵심 회귀 검증

- `DragOverlay` 미렌더링과 원본 sortable row 직접 이동
- 실제 dnd-kit PointerSensor로 3회 연속 pointer down/move/up 후 row 3개 유지
- 매 drop 후 computed opacity 1, visibility visible, inline transform·transition·animation 제거, idle virtualization 복귀
- 전체/내 신청곡 mutation 교차 잠금
- mutation 성공 후 authoritative reset 완료까지 pending 유지
- mutation 실패 snapshot rollback, reset completion, local order 정리
- refresh 실행 중 same-key/same-mode 요청 후속 실행
- invalidate→reset 승격, timer 전 cancel, scope completion 정리
- `ownerOrderLocked`, infinite pages, query prefix 계약 유지

## Fresh review에서 잡아 수정한 내용

- refresh 진행 중 같은 key의 같은 mode 요청이 흡수되던 문제를 key별 revision으로 수정했다.
- 실패 rollback 후 stale `pendingOrder`가 실패한 순서를 다시 표시하던 문제를 move Promise 완료 기준 정리로 수정했다.
- 사용자 녹화에서 동일 증상이 반복돼 overlay animation 옵션만 검사하던 테스트를 폐기하고, overlay 경로 자체를 제거한 뒤 실제 PointerSensor 3회 drop DOM 검증을 추가했다.

## 잔여 위험

- 연결 브라우저가 없어 실제 화면에서 수십 번 반복하는 시각 QA는 못 했지만, jsdom에서 실제 dnd-kit PointerSensor를 사용한 3회 연속 pointer drop DOM 검증은 수행했다.
- 안정적인 서버 순서를 위해 이동 후 reset/refetch 수십~수백 ms 동안 다음 drag가 잠시 비활성화되는 것은 의도한 tradeoff다.
