# Chat Message Realtime Confirmation Mismatch

## Problem

채팅을 전송하면 서버에는 저장되지만 화면에는 바로 표시되지 않고, 일정 시간 뒤 "채팅 전송 확인이 지연되었습니다" 문구가 보였다. 새로고침하면 메시지가 나타났으므로 저장 경로는 성공했고 실시간 수신/확인 경로가 끊긴 상태였다.

## Previous Behavior

프론트는 채팅 메시지 이벤트와 기록 응답을 파싱할 때 `senderId`를 필수 숫자 필드로 요구했다. 내 메시지 전송 확인도 `currentUser.userId === chatMessage.senderId`로만 판정했다. 또한 실시간 `CHAT_MESSAGE`를 놓치면 REST 히스토리에는 메시지가 있는데도 UI는 새로고침 전까지 복구하지 못했다.

## Previous Code

```ts
return (
  typeof candidate.messageId === "number" &&
  typeof candidate.messageType === "string" &&
  typeof candidate.content === "string" &&
  typeof candidate.senderId === "number" &&
  typeof candidate.senderNickname === "string" &&
  ...
);
```

```ts
if (
  currentUserValue?.userId != null &&
  currentUserValue.userId === chatMessage.senderId
) {
  resolveOldestPendingChatSend();
}
```

## Updated Code

```ts
const hasValidSenderId =
  candidate.senderId == null || typeof candidate.senderId === "number";
const hasValidSenderSlug =
  candidate.senderSlug == null || typeof candidate.senderSlug === "string";
```

```ts
const isSentByCurrentUser =
  Boolean(
    currentUserValue?.slug &&
      currentUserValue.slug === chatMessage.senderSlug,
  ) ||
  (currentUserValue?.userId != null &&
    currentUserValue.userId === chatMessage.senderId);
```

Realtime confirmation now also:

- accepts both event envelope and direct chat-message payload bodies.
- listens to the chat topic and the room event topic as a compatibility fallback.
- schedules a latest-history REST backfill if the sent message has not been confirmed quickly.
- shows the delayed-send message only after the final confirmation timeout and failed backfill.

## Problem in the Previous Code

채팅 응답은 API surface나 배포 버전에 따라 발신자 식별에 `senderId` 또는 `senderSlug`를 사용할 수 있다. 프론트가 한쪽만 필수로 요구하면 서버가 정상적으로 보낸 `CHAT_MESSAGE` 이벤트와 `recentChatMessages` 항목이 타입 가드에서 조용히 버려질 수 있다.

그 결과 publish는 성공했더라도 화면에는 메시지가 추가되지 않고, 내 메시지 확인도 풀리지 않아 전송 지연/실패처럼 보일 수 있다. 새로고침하면 보이는 케이스는 이 이벤트 수신/파싱/확인 경로의 실패로 분류해야 한다.

## Evidence

- confirmed reproduction steps: 사용자가 채팅 전송 후 지연 문구가 보이고 새로고침해야 메시지가 보인다고 보고했다.
- previous code: `senderId` 필수 타입 가드.
- API docs: 채팅 전송은 `/app/room/{roomSlug}/chat`, 실시간 수신은 `/topic/room/{roomSlug}/chat`의 `CHAT_MESSAGE` 기준이다.
- after-change behavior: `senderId` 또는 `senderSlug`만 있는 메시지도 유효한 채팅 메시지로 처리한다.
- fallback behavior: 실시간 확인이 누락되면 최신 REST 히스토리를 가져와 새 메시지를 백필한다.

## Cause or Remaining Hypotheses

확정 원인: 프론트 채팅 파서와 전송 확인 로직이 API 응답 shape 변화에 취약했고, 실시간 이벤트 누락 시 복구 경로가 없었다.

남은 가설: 배포 백엔드가 `CHAT_MESSAGE`를 다른 topic으로 발행하거나, STOMP body shape가 문서와 다를 수 있다. 프론트는 room event topic fallback과 REST backfill로 사용자 영향은 줄였지만, 실제 WS frame을 보면 백엔드/프론트 책임을 더 정확히 분리할 수 있다.

## Solution Options

- option 1: 서버가 `senderId`를 다시 내려주도록 API를 변경한다.
- option 2: 프론트가 `senderSlug`를 표준 발신자 식별자로 사용한다.
- option 3: 프론트가 `senderSlug`와 legacy `senderId`를 둘 다 허용한다.
- option 4: 실시간 이벤트가 누락되면 REST 최신 히스토리로 백필한다.

## Chosen Solution and Rationale

option 3과 option 4를 선택했다. 발신자 식별자는 `senderSlug`와 `senderId`를 모두 허용하고, 이벤트가 누락돼도 REST 히스토리 기준으로 화면을 회복한다. 이 방식은 서버 저장 성공과 실시간 전파 실패를 UI에서 분리해 다룬다.

## Result

`senderId` 또는 `senderSlug`가 한쪽만 있는 채팅 메시지도 화면에 표시된다. `CHAT_MESSAGE`가 늦거나 누락되면 최신 히스토리를 백필해 새로고침 없이 메시지를 표시한다.

## Reusable Rule

Room chat parser and send-confirm logic must tolerate both `senderSlug` and `senderId`. `CHAT_MESSAGE` is still the primary confirmation source, but missed real-time events need a REST history backfill path.

## Skill or Team Spec Updates

- skill updated: `.agents/skills/queuing-api-boundary/SKILL.md`
- team spec updated: no update because this is a narrow API payload rule.

## Verification

- `npm run lint`
- `npm run build`
