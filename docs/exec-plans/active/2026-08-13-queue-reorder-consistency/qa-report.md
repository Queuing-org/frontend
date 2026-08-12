# QA Report

## 결과

- verdict: pass
- fresh read-only review: first fix, re-review pass
- browser pointer-drag QA: unavailable

## 자동 검증

- targeted queue/query tests: 7 files, 20 tests passed
- `npm run test`: 117 files, 398 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

## 핵심 회귀 검증

- drop animation 비활성화와 drag 비활성 시 inline transform 제거
- 전체/내 신청곡 mutation 교차 잠금
- mutation 성공 후 authoritative reset 완료까지 pending 유지
- mutation 실패 snapshot rollback, reset completion, local order 정리
- refresh 실행 중 same-key/same-mode 요청 후속 실행
- invalidate→reset 승격, timer 전 cancel, scope completion 정리
- `ownerOrderLocked`, infinite pages, query prefix 계약 유지

## Fresh review에서 잡아 수정한 내용

- refresh 진행 중 같은 key의 같은 mode 요청이 흡수되던 문제를 key별 revision으로 수정했다.
- 실패 rollback 후 stale `pendingOrder`가 실패한 순서를 다시 표시하던 문제를 move Promise 완료 기준 정리로 수정했다.

## 잔여 위험

- 연결 브라우저가 없어 실제 포인터로 수십 번 연속 drag하는 시각 재현은 수행하지 못했다.
- 안정적인 서버 순서를 위해 이동 후 reset/refetch 수십~수백 ms 동안 다음 drag가 잠시 비활성화되는 것은 의도한 tradeoff다.
