# 실시간·무한 목록의 무제한 런타임 작업

## Problem

방 사용 시간이 길어지거나 참가자·채팅·큐·방 목록이 커질수록 API 요청, React 상태, DOM, observer, WebSocket 재연결 작업이 함께 증가할 수 있었다. mutation과 WebSocket 사건이 겹치면 같은 방 데이터를 연속 refetch했고, 이미 진행 중인 GET을 보존하면 오래된 응답이 최신 상태 뒤에 반영될 위험도 있었다.

## Previous Behavior

- 방 mutation과 WebSocket handler가 각자 playback, participants, queue query를 즉시 invalidate했다.
- 일부 TanStack GET query는 `QueryFunctionContext.signal`을 Axios까지 전달하지 않았다.
- 참가자마다 badge query와 `ResizeObserver`를 만들었다.
- 채팅과 홈 stage는 누적 데이터 크기만큼 상태·DOM을 유지했다.
- 검색 입력은 debounce와 이전 요청 취소 없이 query를 만들 수 있었다.

## Previous Code

```ts
queryClient.invalidateQueries({ queryKey: roomKeys.playback(slug) });
queryClient.invalidateQueries({ queryKey: roomKeys.participants(slug) });
queryClient.invalidateQueries({ queryKey: roomKeys.queue(slug) });

queryFn: () => fetchRoomMeta(slug)
```

## Updated Code

```ts
scheduleRoomReadInvalidation(queryClient, slug, {
  queryKeys: [
    roomKeys.playback(slug),
    roomKeys.participants(slug),
    roomKeys.queue(slug),
  ],
});

queryFn: ({ signal }) => fetchRoomMeta(slug, { signal })
```

## Problem in the Previous Code

각 event source가 refetch를 독립적으로 소유해서 짧은 burst가 네트워크 burst로 증폭됐다. 취소 신호가 API 경계에서 끊기면 화면을 떠난 요청도 끝까지 실행되고, `cancelRefetch: false`를 사용하면 오래된 in-flight 응답이 최신 사건 뒤에 도착할 수 있다. 실시간·무한 목록에 상태와 DOM 상한이 없으면 사용 시간이 곧 메모리·렌더 비용이 된다.

## Evidence

- confirmed reproduction steps: 단위 테스트에서 같은 방 invalidation을 짧은 간격으로 반복하고 실제 fetch 횟수를 측정했다.
- requests/responses tested: meta, playback, participants, queue, chat, profile, music power, badges, room/user search의 AbortSignal 전달을 검증했다.
- logs/screenshots: production build에서 STOMP frame debug가 비활성화되고 home stage가 최대 7개만 렌더됨을 확인했다.
- cases that did not reproduce: 다른 room slug의 scheduler와 socket session은 서로 합쳐지지 않았다.
- baseline performance or behavior: event source마다 즉시 invalidate, chat/stage DOM 무제한, participant observer/query per item.
- after-change performance or behavior: 같은 방 75ms burst coalescing, chat 500개, participant DOM 24개, queue idle DOM 목록당 40개, stage 7개, discovery 3 page/90 room, badge visible-only, shared ResizeObserver.

## Cause or Remaining Hypotheses

확인된 원인은 비동기 작업의 owner와 상한이 기능별 handler·item component에 흩어져 있던 구조다. 모바일 hard-load의 짧은 layout shift, SUIT 전송량, 사용자가 모든 참가자와 큐 페이지를 끝까지 탐색하는 극단값은 실제 계측이 없어 잔여 위험으로 남는다.

## Solution Options

- option 1: polling 간격이나 debounce만 늘린다. 구현은 작지만 stale 응답과 DOM 증가를 해결하지 못한다.
- option 2: 방 단위 scheduler, API 취소, visible/window 상한을 함께 적용한다.
- option 3: 모든 목록을 즉시 virtualization하고 backend batch API를 가정한다. 현재 규모와 공개 API 계약에 비해 변경 위험이 크다.

## Chosen Solution and Rationale

option 2를 선택했다. 현재 서버 계약을 바꾸지 않으면서 네트워크·상태·DOM 작업의 owner와 상한을 테스트할 수 있고, queue drag/drop이나 participant action 같은 기존 UI 의미를 덜 흔든다. 완전 virtualization과 batch API는 실제 부하 증거 및 backend 계약과 함께 후속 적용하는 편이 안전하다.

## Result

방 event burst가 하나의 재검증 흐름으로 합쳐지고 오래된 GET은 먼저 취소된다. route handoff 중 socket 재연결 중복을 줄였고, 참가자·채팅·큐·홈·검색의 요청·상태·DOM에 숫자로 검증하는 경계를 추가했다. shared/feature 의존 경계와 미사용 코드도 함께 정리해 같은 비용이 숨은 경로로 재도입되기 어려워졌다.

## Reusable Rule

실시간 또는 무한 목록은 요청 상한, 상태 상한, DOM 상한을 각각 명시하고 테스트한다. TanStack GET의 signal은 transport까지 전달하며, 동일 서버 상태를 바꾸는 mutation과 실시간 사건은 하나의 invalidation owner를 사용한다.

## Skill or Team Spec Updates

- skill updated: `queuing-api-boundary`에 GET signal 전달 규칙을 추가했다.
- skill updated: `queuing-ui-flow`에 실시간·무한 목록의 요청/상태/DOM 상한 규칙을 추가했다.
- skill updated: `queuing-qa-reviewer`에 burst·large fixture 상한 검증 규칙을 추가했다.
- team spec updated: 없음. 기존 AGENTS의 API/UI/state boundary 원칙 안에서 skill을 구체화했다.

## Verification

- `npm ci --ignore-scripts --no-audit --no-fund`
- `npm run lint`
- `npm run test` — 98 files / 292 tests
- `npm run build`
- 구현 lane 간 읽기 전용 교차 리뷰
- 잔여 위험: 모바일 실제 CLS, backend badge batch 부재, 누적 queue DOM, 전역 SUIT 전송량
