# 채팅 callback identity에 의한 STOMP 재구독 누락

## Problem

방 채팅이 연속으로 들어올 때 일부 메시지가 실시간 화면에서 빠지고 새로고침 후 REST 기록에는 나타났다. 같은 WebSocket transport 안에서 채팅 topic이 `UNSUBSCRIBE → SUBSCRIBE`를 반복한다는 관찰이 함께 제보됐다.

## Previous Behavior

`useRoomChat`이 렌더마다 새 `onMessageDeleted` 함수를 만들었다. 이 함수 identity가 `useRoomChatRealtime`의 message parser, subscription ensure callback, subscription effect까지 전파됐다. 채팅 수신으로 history state가 갱신될 때마다 effect cleanup이 기존 topic을 해제하고 새로 구독할 수 있었다.

## Previous Code

```ts
useRoomChatRealtime({
  onMessage: appendMessage,
  onMessageDeleted: ({ messageKey, content }) =>
    markMessageDeleted(messageKey, content),
});

const handleChatMessageBody = useCallback(
  (roomSlug: string, body: string) => {
    onMessage(parseChatMessageEvent(body, roomSlug));
  },
  [onMessage, onMessageDeleted],
);
```

## Updated Code

```ts
const handleMessageDeleted = useCallback(
  ({ messageKey, content }: ChatMessageDeletedData) => {
    markMessageDeleted(messageKey, content);
  },
  [markMessageDeleted],
);

const onMessageRef = useRef(onMessage);
useLayoutEffect(() => {
  onMessageRef.current = onMessage;
}, [onMessage]);

const handleChatMessageBody = useCallback((roomSlug: string, body: string) => {
  const chatMessage = parseChatMessageEvent(body, roomSlug);
  if (chatMessage) onMessageRef.current(chatMessage);
}, [resolvePendingChatSend]);
```

채팅 topic effect와 user event effect도 분리해, room access token 변경은 채팅 구독만 교체하고 user event 구독은 유지한다. 구독 callback은 handler ref를 호출하므로 parsing·pending 처리 callback 변화도 subscription effect identity로 전파되지 않는다. 로그인 사용자 slug가 실제로 바뀔 때는 이전 사용자의 pending timer와 in-flight backfill만 무효화하고 user event 구독을 교체한다.

## Problem in the Previous Code

구독 destination과 인증 정보는 그대로인데 event handler 함수 객체가 새로 생겼다는 이유로 transport side effect를 재실행했다. React effect cleanup은 새 effect 실행 전에 기존 구독을 먼저 해제하므로, 서버나 WebSocket 연결이 정상이어도 두 frame 사이에 짧은 미구독 구간이 생긴다. 그 구간의 메시지는 DB에 저장되지만 현재 화면에는 전달되지 않을 수 있다.

## Evidence

- confirmed reproduction steps: 동일 slug·access token으로 hook을 rerender하면서 `onMessage` callback identity만 교체
- baseline behavior: `subscribeRoomChatEvents`가 2회 호출되어 회귀 테스트 실패
- failure: `expected subscribeRoomChatEvents to be called once, but got 2 times`
- after-change behavior: subscribe 1회, 기존 subscription unsubscribe 0회, 이후 이벤트는 최신 callback으로 전달
- identity change behavior: room access token 변경 시 채팅 subscription만 1회 교체하고 user event subscription은 유지
- lifecycle matrix: 같은 user slug의 객체 변경은 두 구독과 pending을 유지하고, user slug 제거는 chat 구독을 유지한 채 user 구독과 pending만 정리하며, room slug 변경·비활성화는 두 구독과 pending을 정리
- logs/screenshots: 제보 화면의 동일 transport `UNSUBSCRIBE → SUBSCRIBE` 반복 분석
- unverified: 운영 broker frame과 누락 메시지 timestamp의 직접 상관관계는 아직 캡처하지 못함

## Cause or Remaining Hypotheses

callback dependency chain이 동일 연결의 재구독을 일으키는 원인은 테스트로 확인됐다. 이 짧은 미구독 구간이 제보된 모든 누락의 유일한 원인인지는 운영 frame 상관관계가 없어 확정하지 않는다. 실제 WebSocket close나 백엔드 session 종료는 별도 재연결 경로다.

## Solution Options

- option 1: 호출부의 inline callback에만 `useCallback`을 적용한다.
- option 2: subscription hook이 최신 callback을 ref로 읽고 effect는 destination·token 같은 구독 identity에만 의존한다.
- option 3: callback 변경 때마다 재구독하되 서버 replay 또는 sequence gap backfill을 추가한다.

## Chosen Solution and Rationale

호출부 callback을 안정화하고 subscription hook도 callback refs로 방어하는 option 1+2를 선택했다. 호출부 실수를 바로잡으면서 다른 소비자가 불안정한 callback을 전달해도 transport 구독이 흔들리지 않는다. 서버 replay는 별도 프로토콜과 비용이 필요하고 이번 확인 원인보다 범위가 크다.

## Result

같은 room slug와 access token에서는 렌더 및 callback 교체가 채팅 topic의 unsubscribe/subscribe를 만들지 않는다. 최신 callback 전달, token·room·사용자·활성화 identity 변경, unmount cleanup, pending timer 정리를 테스트로 고정했다.

## Reusable Rule

STOMP subscription effect는 destination·인증 token·활성화 상태처럼 구독 identity를 바꾸는 값에만 의존한다. 최신 UI handler는 ref로 전달하고 callback identity churn 자체를 재구독 조건으로 사용하지 않는다.

## Skill or Team Spec Updates

- skill updated: `queuing-ui-flow`, `queuing-qa-reviewer`
- team spec updated: 없음. 기존 room realtime 소유권 경계를 바꾸지 않는다.

## Verification

- failing regression confirmed before fix: 1 failed / 7 passed
- fresh review finding reproduced before follow-up fix: 1 failed / 12 passed
- targeted after fix: 3 files / 23 tests passed
- lint: passed
- full test: 149 files / 589 tests passed
- production build: passed
- production broker observation: pending
