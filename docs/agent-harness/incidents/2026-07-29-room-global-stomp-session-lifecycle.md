# Global STOMP Client and Room Session Lifecycle Race

## Problem

backend-core v26.7.1 프론트 마이그레이션 뒤 방 입장이 간헐적으로 5초 timeout에 걸렸고, 방 화면에 들어가도 데이터가 비어 새로고침해야 복구되는 사례가 생겼다. SPA에서 방을 나간 뒤에도 같은 WebSocket 연결에 참가자가 남는 현상도 확인했다.

## Previous Behavior

방 입장은 STOMP client의 `connected` 값을 50ms polling으로 최대 5초 기다렸다. 전역 follow presence가 같은 singleton client를 앱 범위에서 활성화했고, STOMP 재연결 지연도 정확히 5초였다.

방 입장 뒤 연결이 끊겼다가 복구되면 프론트는 room topic만 다시 구독했다. 새 socket session의 `/join` handshake와 route exit의 `/leave`는 수행하지 않았다.

## Previous Code

```ts
const client = new Client({ reconnectDelay: 5000 });

async function waitForSocketConnected(timeoutMs = 5000) {
  // connected를 polling하고 같은 5초 경계에서 timeout
}

onConnect: () => {
  subscribeWithConfig(config, true);
  invalidateRoomReads(config.slug);
};
```

## Updated Code

```ts
await waitForSocketConnected(options.signal);

onWebSocketClose: () => {
  setStatus("joining");
  reconnectPendingRef.current = true;
};

onConnect: () => {
  void joinRoom(config.slug, payload, { signal })
    .then(() => {
      subscribeWithConfig(config, true);
      invalidateRoomReads(config.slug);
      setStatus("joined");
    });
};
```

입장 요청은 `AbortSignal`을 받고, join frame을 보낸 뒤 취소되면 같은 socket session에 `/leave`를 보낸다. 정상 route cleanup도 room subscription 정리와 별개로 `/leave`를 publish한다.

## Problem in the Previous Code

STOMP transport 연결과 백엔드 방 참가 세션은 서로 다른 상태다. 전역 provider가 transport를 먼저 활성화하면 `active=true`, `connected=false`인 재연결 구간이 평소보다 자주 생긴다. 이때 방 입장 제한 시간과 재연결 지연이 모두 5초라 정상 재연결 직전에 프론트 timeout이 먼저 발생할 수 있다.

또한 새 WebSocket session은 이전 session의 방 참가 상태를 상속하지 않는다. topic 재구독만 하면 이벤트를 일부 받을 수 있어도 백엔드 participant 권한과 presence는 복구되지 않는다. 반대로 route에서 topic만 해제하면 앱 범위 socket이 살아 있는 동안 이전 참가자 세션이 남는다.

## Evidence

- REST `/rooms/{slug}`, `/playback`, `/participants`는 진단 당시 약 44~56ms로 정상 응답했다.
- 직접 STOMP 진단은 연결 약 113ms, `ROOM_JOINED` 약 167ms로 정상 처리됐다.
- Chrome에서 간헐적으로 `웹소켓 연결 시간이 초과되었습니다.`를 재현했다.
- 방에서 SPA로 나간 뒤 `/participants`에 guest가 남고, Chrome socket을 종료한 뒤에야 제거되는 것을 확인했다.
- backend `RoomSocketController`의 실제 계약은 `/app/room/{roomSlug}/join`과 `/app/room/{roomSlug}/leave`다.
- PR에서 추가한 app-scoped follow presence가 singleton STOMP client를 방 입장 전부터 활성화한다.

## Cause or Remaining Hypotheses

확정 원인은 전역 transport 재연결과 방 입장 timeout의 동일한 5초 경계, reconnect 시 join handshake 누락, route cleanup 시 leave 누락이다.

별도 잔여 이슈로 모바일 viewport에서 기존 `useMediaQuery` 초기값 때문에 home hydration mismatch가 재현됐다. 이 현상은 이번 PR diff 이전부터 존재하며 방 세션 수정과는 별도 범위다.

## Solution Options

- option 1: 방에 들어갈 때마다 전역 socket을 강제로 끊고 새로 연결한다.
- option 2: timeout만 길게 늘리고 기존 polling/topic 재구독을 유지한다.
- option 3: transport 연결 대기를 이벤트 기반으로 바꾸고, reconnect마다 join -> subscriptions -> read invalidation 순서를 복구하며, abort/unmount에 leave를 보낸다.

## Chosen Solution and Rationale

option 3을 선택했다. 전역 presence와 방 기능이 singleton transport를 공유하는 구조는 유지하되, transport 상태와 방 세션 상태를 분리했다. timeout 연장만으로는 빈 화면과 ghost participant를 해결하지 못하고, 방마다 socket을 강제로 재생성하면 전역 presence 구독을 깨뜨리기 때문이다.

## Result

- 이미 활성화됐지만 재연결 중인 client도 다음 `onConnect`를 기다린다.
- 방 socket 복구는 join handshake 성공 뒤에만 room/chat 구독과 REST 재검증을 재개한다.
- 중복 `onConnect`는 추가 join/subscription을 만들지 않는다.
- route exit와 입장 중 unmount가 backend participant session을 정리한다.
- React Query는 4xx/429를 중복 재시도하지 않으면서 network/5xx 조회의 기존 일시 오류 복구를 유지한다.

## Reusable Rule

Global STOMP transport state and room membership state must be modeled separately. Every new socket session needs a room join handshake; topic cleanup is not a leave handshake.

## Skill or Team Spec Updates

- skill updated: `.agents/skills/queuing-api-boundary/SKILL.md`
- skill updated: `.agents/skills/queuing-ui-flow/SKILL.md`
- skill updated: `.agents/skills/queuing-qa-reviewer/SKILL.md`
- team spec updated: no update because the specialist rules now own this boundary.

## Verification

- targeted Vitest: 4 files / 8 tests pass
- `npm run test`: 33 files / 84 tests pass
- `npm run lint`: pass
- `npm run build`: pass
- local desktop Chrome `/home`: rendered empty-room state
- room E2E after-change: not run because the shared backend had no room fixture and creating external test data was outside scope
