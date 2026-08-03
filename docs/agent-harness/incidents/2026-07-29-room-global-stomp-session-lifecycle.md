# Global STOMP Client and Room Session Lifecycle Race

## Problem

backend-core v26.7.1 프론트 마이그레이션 뒤 방 입장이 간헐적으로 5초 timeout에 걸렸고, 방 화면에 들어가도 데이터가 비어 새로고침해야 복구되는 사례가 생겼다. SPA에서 방을 나간 뒤에도 같은 WebSocket 연결에 참가자가 남는 현상도 확인했다.

후속 사용자 캡처에서는 로그인 상태에서 STOMP `CONNECTED` 뒤 `/user/playlist/events`를 `SUBSCRIBE`하고 `/join`을 `SEND`했지만 `ROOM_JOINED` 없이 입장 timeout 후 `UNSUBSCRIBE`되는 흐름이 확인됐다. 이후 계정 A/B 검증에서 같은 컴퓨터·브라우저·프론트 커밋에서도 특정 계정(`따뜻한코러스810`)만 실패하고 다른 계정은 성공했다. 오래된 프론트 커밋에서도 동일 계정만 실패했으므로 이 증상은 프론트 변경으로 생긴 회귀가 아니었다.

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

follow presence는 app-wide 전용 STOMP client를 사용하고, room membership은 기존 room client를 사용한다. room join은 `/user/playlist/events` 구독 호출 뒤 `/join`을 한 번만 publish한다.

## Problem in the Previous Code

STOMP transport 연결과 백엔드 방 참가 세션은 서로 다른 상태다. 전역 provider가 transport를 먼저 활성화하면 `active=true`, `connected=false`인 재연결 구간이 평소보다 자주 생긴다. 이때 방 입장 제한 시간과 재연결 지연이 모두 5초라 정상 재연결 직전에 프론트 timeout이 먼저 발생할 수 있다.

또한 새 WebSocket session은 이전 session의 방 참가 상태를 상속하지 않는다. topic 재구독만 하면 이벤트를 일부 받을 수 있어도 백엔드 participant 권한과 presence는 복구되지 않는다. 반대로 route에서 topic만 해제하면 앱 범위 socket이 살아 있는 동안 이전 참가자 세션이 남는다.

로그인 성공 시 `BadgeAwardProvider`가 앱 children을 keyed authenticated provider로 다시 감싸 route 전체를 remount했다. 동시에 follow presence와 room join이 같은 STOMP client에서 서로 다른 user destination을 구독했다.

## Evidence

- REST `/rooms/{slug}`, `/playback`, `/participants`는 진단 당시 약 44~56ms로 정상 응답했다.
- 직접 STOMP 진단은 연결 약 113ms, `ROOM_JOINED` 약 167ms로 정상 처리됐다.
- Chrome에서 간헐적으로 `웹소켓 연결 시간이 초과되었습니다.`를 재현했다.
- 방에서 SPA로 나간 뒤 `/participants`에 guest가 남고, Chrome socket을 종료한 뒤에야 제거되는 것을 확인했다.
- backend `RoomSocketController`의 실제 계약은 `/app/room/{roomSlug}/join`과 `/app/room/{roomSlug}/leave`다.
- PR에서 추가한 app-scoped follow presence가 singleton STOMP client를 방 입장 전부터 활성화한다.
- 사용자 실패 캡처: `CONNECTED -> SUBSCRIBE /user/playlist/events -> SEND /join -> UNSUBSCRIBE`, `ROOM_JOINED` 없음.
- 같은 시점 대상 방 REST meta/state는 200이었고 participants는 비어 있어 join 완료 증거가 없었다.
- 직접 STOMP `SUBSCRIBE receipt` 요청은 `CONNECTED`만 수신하고 8초 내 `RECEIPT`를 받지 못했다.
- 특정 계정은 배포/로컬 및 신규/과거 프론트 커밋에서 모두 실패했고, 다른 계정은 같은 컴퓨터의 동일 조건에서 성공했다.
- 같은 실패 계정은 다른 컴퓨터에서도 증상을 비교해야 했지만, 확보된 프론트 A/B만으로도 “이번 프론트 기능 개발이 원인”이라는 가설은 기각됐다.
- provider 주입 및 socket 분리 실험은 서로 다른 인증 상태를 완전히 통제하지 못했으므로 방 입장 실패의 인과 증거로 사용할 수 없다.
- 비로그인에서 로그인으로 `me`가 바뀔 때 badge provider children의 mount 횟수가 1회로 유지되는 회귀 테스트를 추가했다.

## Cause or Remaining Hypotheses

확정된 프론트 문제는 transport 연결 대기 경계, reconnect 시 join handshake 누락, route cleanup 시 leave 누락이었다. 이들은 독립적으로 수정 가치가 있지만 특정 로그인 계정의 입장 실패 원인은 아니었다.

특정 계정 실패의 남은 가설은 백엔드의 계정별 방 참가/session 상태다. 프론트에서 participant polling, 강제 새로고침, 임의 지연을 추가해 우회하면 원인을 숨기고 정상 계정의 흐름만 복잡하게 만들므로 제거했다.

별도 잔여 이슈로 모바일 viewport에서 기존 `useMediaQuery` 초기값 때문에 home hydration mismatch가 재현됐다. 이 현상은 이번 PR diff 이전부터 존재하며 방 세션 수정과는 별도 범위다.

## Solution Options

- option 1: 방에 들어갈 때마다 전역 socket을 강제로 끊고 새로 연결한다.
- option 2: timeout만 길게 늘리고 기존 polling/topic 재구독을 유지한다.
- option 3: transport 연결 대기를 이벤트 기반으로 바꾸고, reconnect마다 join -> subscriptions -> read invalidation 순서를 복구하며, abort/unmount에 leave를 보낸다.
- option 4: user-event `SUBSCRIBE` receipt를 기다린다. 현재 backend broker가 receipt를 반환하지 않아 사용할 수 없다.
- option 5: app-wide follow presence와 route-scoped room membership의 STOMP client를 분리하고 auth UI provider의 children identity를 유지한다.

## Chosen Solution and Rationale

기본 방 세션 복구에는 option 3을 적용했다. presence와 room 연결 분리는 서로 다른 생명주기를 격리하는 구조적 선택으로 유지하되, 특정 계정의 입장 실패를 고친 증거로 주장하지 않는다.

250ms 안정화는 영향 사용자 재검증에서 실패했고 같은 연결의 user destination 충돌을 해결하지 못해 제거했다. join 재전송도 backend idempotency 계약이 없어 선택하지 않았다.

## Result

- 이미 활성화됐지만 재연결 중인 client도 다음 `onConnect`를 기다린다.
- 방 socket 복구는 join handshake 성공 뒤에만 room/chat 구독과 REST 재검증을 재개한다.
- 중복 `onConnect`는 추가 join/subscription을 만들지 않는다.
- route exit와 입장 중 unmount가 backend participant session을 정리한다.
- React Query는 4xx/429를 중복 재시도하지 않으면서 network/5xx 조회의 기존 일시 오류 복구를 유지한다.
- follow presence와 room membership은 별도 STOMP client에서 독립적으로 reconnect한다.
- auth 전환이 badge SSE를 시작해도 현재 route children은 remount되지 않는다.
- join은 user-event 구독 호출 뒤 임의 지연 없이 한 번만 전송된다.

## Reusable Rule

Global presence transport state and room membership state must be modeled separately when their owners and terminal states differ. Every new room socket session needs a join handshake; topic cleanup is not a leave handshake. Auth-dependent providers must not change the wrapper identity of the app children they observe. For account-specific failures, compare the same account across frontend versions before attributing causality; do not add polling, hard reloads, arbitrary delays, or unsafe join retries as diagnostic leftovers.

## Skill or Team Spec Updates

- skill updated: `.agents/skills/queuing-api-boundary/SKILL.md`
- skill updated: `.agents/skills/queuing-ui-flow/SKILL.md`
- skill updated: `.agents/skills/queuing-qa-reviewer/SKILL.md`
- team spec updated: no update because the specialist rules now own this boundary.

## Verification

- focused Vitest: 3 files / 7 tests pass
- before-fix authenticated-provider Chrome E2E: `room.join-timeout` reproduced
- after-fix authenticated-provider Chrome E2E는 검증에 사용한 계정에서는 통과했지만, 특정 실패 계정 문제 해결의 증거는 아님
- full Vitest 33 files / 87 tests, lint, build, diff check: pass
- fresh read-only QA: pass
- 후속 계정 A/B: 특정 계정만 과거/현재 프론트 모두 실패하여 프론트 회귀 가설 기각
