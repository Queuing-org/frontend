# Room Player `removeChild` 에러 분석

## 1. 문제현상

방 화면에서 곡이 끝난 직후 STOMP 이벤트를 받은 뒤, 브라우저 콘솔에 아래 에러가 발생한다.

```text
Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node':
The node to be removed is not a child of this node.
```

관찰된 흐름은 다음과 같다.

1. 곡 종료 시점에 방 이벤트(`/topic/room/{slug}/events`)를 수신한다.
2. `TRACK_ENDED` 또는 재생 상태 변경에 따라 현재 곡 정보가 비워진다.
3. 화면이 유튜브 플레이어 대신 placeholder를 렌더링하려는 순간 React DOM 정리 단계에서 예외가 발생한다.
4. 그 뒤 `[STOMP] >>> UNSUBSCRIBE` 로그가 보이지만, 이는 에러 이후 cleanup 과정에서 같이 보인 로그로 판단된다.

즉, 표면적으로는 "곡이 끝난 뒤 플레이어가 사라질 때" 터지는 에러다.

## 2. 이유분석 (코드와 함께)

### 2-1. 곡 종료 후 현재 비디오 ID가 `null`이 되는 흐름

`src/app/room/[slug]/page.tsx`에서는 방 이벤트를 구독하고 있다.

```ts
if (
  event.type === "QUEUE_ADDED" ||
  event.type === "QUEUE_REMOVED" ||
  event.type === "TRACK_STARTED" ||
  event.type === "TRACK_ENDED"
) {
  void refetchRoomState();
  return;
}
```

이후 현재 재생할 비디오 ID는 `getCurrentVideoId()`로 계산된다.

```ts
const playbackStatus = getLatestPlaybackState(
  roomState?.playbackStatus,
  livePlaybackStatus,
);
const currentVideoId = getCurrentVideoId(roomState, playbackStatus);
```

`getCurrentVideoId()`는 `playbackStatus.videoId`도 없고 `roomState.currentEntry.track.videoId`도 없으면 `null`을 반환한다.

```ts
function getCurrentVideoId(
  roomState: RoomStateSnapshot | undefined,
  playbackStatus: PlaybackState | RoomStateSnapshot["playbackStatus"] | null,
) {
  const playbackVideoId = playbackStatus?.videoId;
  if (typeof playbackVideoId === "string" && playbackVideoId.trim()) {
    return playbackVideoId.trim();
  }

  const currentTrackVideoId = roomState?.currentEntry?.track.videoId;
  if (typeof currentTrackVideoId === "string" && currentTrackVideoId.trim()) {
    return currentTrackVideoId.trim();
  }

  return null;
}
```

즉, 마지막 곡이 끝나거나 현재 트랙이 비워지면 `currentVideoId`가 `null`로 바뀐다.

### 2-2. `videoId === null`이면 플레이어 DOM을 placeholder로 교체한다

`src/features/playlist/player/ui/YouTubePlayer.tsx`에서는 `videoId`가 없으면 플레이어를 정리하고 placeholder를 렌더링한다.

```ts
useEffect(() => {
  if (!videoId) {
    destroyPlayer();
    return;
  }

  // player setup...
}, [applyDesiredPlayback, destroyPlayer, onPlaybackStateChange, onPlayerReady, videoId]);
```

```tsx
if (!videoId) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
      재생할 유튜브 영상이 아직 없습니다.
    </div>
  );
}
```

즉, 현재 구조는 "곡이 없어지면 React가 플레이어 영역을 통째로 다른 DOM으로 바꾸는 방식"이다.

### 2-3. 그런데 YouTube Iframe API가 React가 만든 노드를 직접 교체한다

같은 파일에서 유튜브 플레이어는 아래 코드로 생성된다.

```ts
createdPlayer = new YT.Player(containerRef.current, {
  videoId: videoId ?? undefined,
  playerVars: {
    autoplay: 1,
    controls: 1,
    playsinline: 1,
    rel: 0,
    origin: window.location.origin,
  },
});
```

렌더링된 React DOM은 원래 아래와 같다.

```tsx
return (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-black shadow-sm">
    <div ref={containerRef} className="aspect-video w-full" />
    {playerError ? <div>...</div> : null}
  </div>
);
```

문제는 `YT.Player(containerRef.current, ...)`가 React가 만든 `<div ref={containerRef}>`를 그대로 유지하는 것이 아니라, 내부적으로 iframe 기반 플레이어로 바꿔 관리한다는 점이다.

그 결과 React 입장에서는 아직 "`containerRef`가 가리키던 div가 DOM에 있다"고 생각하지만, 실제 브라우저 DOM에서는 그 노드가 이미 YouTube API에 의해 교체되었을 수 있다.

### 2-4. 최종적으로 `removeChild` 충돌이 난다

곡이 끝나서 `currentVideoId`가 `null`이 되면 React는 기존 플레이어 subtree를 제거하고 placeholder를 넣으려 한다.

하지만 실제 DOM에서는 React가 제거하려는 노드가 이미 부모의 자식이 아니기 때문에 다음과 같은 예외가 발생한다.

```text
Failed to execute 'removeChild' on 'Node':
The node to be removed is not a child of this node.
```

정리하면 원인은 다음과 같다.

1. STOMP 이벤트가 상태 변화를 유발한다.
2. 상태 변화로 `currentVideoId`가 `null`이 된다.
3. React가 플레이어 DOM을 제거하려고 한다.
4. 그런데 그 DOM은 이미 YouTube API가 교체하거나 직접 관리하고 있다.
5. 그래서 React의 DOM 정리 단계에서 `removeChild` 예외가 발생한다.

즉, 직접 원인은 STOMP가 아니라 **React와 YouTube Iframe API가 같은 DOM 노드의 소유권을 동시에 가진 구조**다.

## 3. 해결과정

### 3-1. 빠른 완화 방향

질문한 방향대로, **곡이 끝났을 때 placeholder로 바꾸지 않고 마지막 유튜브 창 상태를 그대로 유지하는 방식**은 현재 증상을 줄이는 데 유효할 가능성이 높다.

이 방식의 핵심은 다음과 같다.

1. `videoId`가 `null`이 되어도 플레이어 subtree를 React가 제거하지 않는다.
2. 유튜브 iframe이 떠 있는 영역을 그대로 둔다.
3. 필요하면 `pauseVideo()`만 호출하거나, "현재 재생 중인 곡이 없습니다" 같은 안내 문구를 overlay로만 얹는다.

이렇게 하면 "곡 종료 직후 placeholder로 교체되는 순간"이 사라지므로, 현재 재현된 에러는 없어질 가능성이 높다.

### 3-2. 다만 이건 증상 완화에 가깝다

이 접근은 현재 보이는 현상에는 효과적일 수 있지만, 구조적인 문제를 완전히 없애는 것은 아니다.

이유는 다음과 같다.

1. React는 여전히 자신이 만든 노드를 추적하고 있다.
2. YouTube API는 여전히 그 노드를 직접 교체하거나 별도 관리한다.
3. 따라서 이후 페이지 이탈, 컴포넌트 언마운트, 다른 재생 흐름 변경 시 비슷한 충돌이 다시 나타날 가능성이 남아 있다.

### 3-3. 근본적인 수정 방향

근본 해결은 **React가 소유하는 wrapper**와 **YouTube가 소유하는 실제 player host**를 분리하는 쪽이 더 안전하다.

권장 방향은 다음과 같다.

1. React는 항상 고정된 바깥 wrapper만 렌더링한다.
2. wrapper 내부에 YouTube용 host element를 명시적으로 만들고, 그 내부는 YouTube API가 관리하게 둔다.
3. 곡이 끝났을 때는 wrapper를 제거하지 않고, player를 pause 상태로 두거나 overlay만 표시한다.
4. 컴포넌트 cleanup 시에는 React가 직접 교체된 노드를 제거하려 들지 않도록, YouTube 전용 영역을 명시적으로 정리한다.

예상 구조는 아래와 비슷하다.

```tsx
return (
  <div className="playerShell">
    <div ref={playerHostRef} />
    {!videoId ? <div className="playerOverlay">현재 재생 중인 곡이 없습니다.</div> : null}
  </div>
);
```

핵심은 "placeholder로 전체 subtree를 교체"하는 대신, **항상 같은 껍데기 DOM을 유지하고 상태만 바꾸는 것**이다.

## 4. 결과

현재까지의 결론은 다음과 같다.

1. 에러의 직접 원인은 STOMP 자체가 아니라 React DOM과 YouTube Iframe API의 DOM 소유권 충돌이다.
2. 곡 종료 후 `currentVideoId`가 `null`이 되면서 placeholder로 교체되는 순간에 문제가 드러난다.
3. 질문한 방식처럼 "placeholder로 바꾸지 않고 마지막 유튜브 창을 그대로 유지"하는 것은 빠른 완화책으로 타당하다.
4. 다만 근본적으로는 React와 YouTube가 서로 다른 DOM 경계를 갖도록 구조를 정리하는 편이 더 안전하다.
5. 아직 코드는 수정하지 않았고, 현재 문서는 원인 분석과 수정 방향 정리 단계다.
