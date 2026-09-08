# 로그아웃 뒤 지연된 본인 조회가 계정을 복원하는 경합

## Problem
로그아웃·탈퇴 성공 직전 진행 중이던 me 조회가 늦게 완료되면 UI가 이전 계정을 다시 로그인 상태로 판단할 수 있었다.

## Previous Behavior
성공 처리에서 me를 null로 저장하고 일부 계정별 캐시를 제거했지만 진행 중 조회는 유지했다.

## Previous Code
```ts
qc.setQueryData(userKeys.me(), null);
```

## Updated Code
```ts
await qc.cancelQueries({ queryKey: userKeys.me(), exact: true });
qc.setQueryData(userKeys.me(), null);
qc.removeQueries({ queryKey: trackSuggestionKeys.all() });
```
본인 API도 QueryFunctionContext.signal을 Axios까지 전달한다.

## Problem in the Previous Code
setQueryData는 진행 중 queryFn을 취소하지 않는다. queryFn의 늦은 성공이 null보다 뒤에 캐시에 기록된다.

## Evidence
- 독립 QA에서 실제 QueryClient의 me null → 과거 fetch resolve → 이전 계정 복원을 재현.
- `useAccountExit.test.tsx`에서 실제 logout/withdraw mutation hook과 지연 Promise를 결합하여 signal.aborted, 최종 me null, 검색 캐시 제거를 검증.
- 실서비스 계정으로 재현하지 않았음. 원인은 클라이언트 캐시 경합으로 한정.

## Cause or Remaining Hypotheses
진행 중 조회를 취소하지 않은 캐시 초기화 순서가 확인된 원인. 서버 로그아웃 동작에 대한 문제는 주장하지 않는다.

## Solution Options
- me만 null: 이후 성공 응답에 덮임.
- 모든 캐시 삭제: 영향 범위가 크고 불필요한 공용 캐시까지 버림.
- 본인 조회 취소 후 null 및 관련 개인 캐시 삭제: 선택.

## Chosen Solution and Rationale
기존 계정 종료 mutation이 순서를 소유하도록 제한했다. signal 전파와 TanStack 취소를 함께 적용해 전송 및 캐시 반영을 중단한다.

## Result
지연 응답이 계정을 복원하지 않으며 자주 신청한 곡·검색 결과가 다음 계정으로 노출되지 않는다.

## Reusable Rule
계정 종료 시 진행 중 identity 조회를 먼저 취소하고 identity/개인 캐시를 정리한다. 캐시를 비우는 것만으로 취소가 되지 않는다.

## Skill or Team Spec Updates
- queuing-qa-reviewer: 로그아웃/탈퇴 지연 identity 응답 검사 추가.

## Verification
- 전체 `npm test`: 711개 통과(추가 후 최종 숫자는 실행 계획 QA 참조).
- `npm run lint`, `npm run build` 통과.
- 브라우저 연결 없음으로 실계정 수동 검증 미실행.
