# React Wheel Passive Listener Prevents Scroll Lock

## Problem

방 목록에서 마우스 휠로 이전/다음 방을 선택할 때 방 전환과 페이지 스크롤이 동시에 발생할 수 있다.

`useRoomWheelNavigation`은 휠 입력을 방 전환 입력으로 소비하려고 `event.preventDefault()`를 호출한다. 하지만 현재 코드에서는 이 핸들러를 JSX `onWheel` prop으로 전달한다. React DOM 19.2.3의 루트 위임 이벤트 시스템은 `wheel` 이벤트를 passive listener로 등록하므로, 브라우저는 이 `preventDefault()`를 무시한다.

## Previous Behavior

`useRoomWheelNavigation`이 React 합성 이벤트용 `handleWheel` 함수를 반환하고, 방 목록 컴포넌트가 그 함수를 JSX `onWheel`에 연결했다.

현재 워크트리 기준으로 같은 패턴은 두 곳에 있다.

- `src/features/room/search/ui/SearchPageRoomList.tsx`
- `src/features/room/list/ui/HomeRoomStage.tsx`

사용자가 언급한 `SearchPageRoomList.tsx`뿐 아니라 `HomeRoomStage.tsx`도 같은 훅과 `onWheel` 조합을 사용한다.

## Previous Code

```ts
import { useRef, type WheelEvent } from "react";

export function useRoomWheelNavigation({
  previousRoomSlug,
  nextRoomSlug,
  onSelectRoom,
  threshold = DEFAULT_WHEEL_SELECT_THRESHOLD,
  cooldownMs = DEFAULT_WHEEL_COOLDOWN_MS,
}: Params) {
  const lastWheelAtRef = useRef(0);

  return function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const primaryDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (Math.abs(primaryDelta) < threshold) {
      return;
    }

    const now = Date.now();

    if (now - lastWheelAtRef.current < cooldownMs) {
      event.preventDefault();
      return;
    }

    if (primaryDelta > 0 && nextRoomSlug) {
      event.preventDefault();
      lastWheelAtRef.current = now;
      onSelectRoom(nextRoomSlug);
      return;
    }

    if (primaryDelta < 0 && previousRoomSlug) {
      event.preventDefault();
      lastWheelAtRef.current = now;
      onSelectRoom(previousRoomSlug);
    }
  };
}
```

```tsx
const handleWheel = useRoomWheelNavigation({
  previousRoomSlug: previousRoom?.slug,
  nextRoomSlug: nextRoom?.slug,
  onSelectRoom,
});

return (
  <div
    className={styles.viewport}
    aria-label="검색 방 목록"
    onWheel={handleWheel}
  >
    ...
  </div>
);
```

## Updated Code

훅이 React 합성 이벤트 핸들러를 반환하지 않고, 대상 DOM ref를 받아 native `wheel` listener를 직접 등록한다. 핵심은 `addEventListener("wheel", handler, { passive: false })`이다.

```ts
import { useEffect, useRef, type RefObject } from "react";

type Params = {
  viewportRef: RefObject<HTMLElement | null>;
  previousRoomSlug?: string | null;
  nextRoomSlug?: string | null;
  onSelectRoom: (roomSlug: string) => void;
  threshold?: number;
  cooldownMs?: number;
};

export function useRoomWheelNavigation({
  viewportRef,
  previousRoomSlug,
  nextRoomSlug,
  onSelectRoom,
  threshold = DEFAULT_WHEEL_SELECT_THRESHOLD,
  cooldownMs = DEFAULT_WHEEL_COOLDOWN_MS,
}: Params) {
  const lastWheelAtRef = useRef(0);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      const primaryDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (Math.abs(primaryDelta) < threshold) {
        return;
      }

      const now = Date.now();

      if (now - lastWheelAtRef.current < cooldownMs) {
        event.preventDefault();
        return;
      }

      if (primaryDelta > 0 && nextRoomSlug) {
        event.preventDefault();
        lastWheelAtRef.current = now;
        onSelectRoom(nextRoomSlug);
        return;
      }

      if (primaryDelta < 0 && previousRoomSlug) {
        event.preventDefault();
        lastWheelAtRef.current = now;
        onSelectRoom(previousRoomSlug);
      }
    }

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, [
    viewportRef,
    previousRoomSlug,
    nextRoomSlug,
    onSelectRoom,
    threshold,
    cooldownMs,
  ]);
}
```

```tsx
const viewportRef = useRef<HTMLDivElement>(null);

useRoomWheelNavigation({
  viewportRef,
  previousRoomSlug: previousRoom?.slug,
  nextRoomSlug: nextRoom?.slug,
  onSelectRoom,
});

return (
  <div
    ref={viewportRef}
    className={styles.viewport}
    aria-label="검색 방 목록"
  >
    ...
  </div>
);
```

`HomeRoomStage.tsx`는 대상 요소가 `section.viewport`인지 내부 `div.rail`인지 UX 의도를 보고 정해야 한다. 기존 코드는 `div.rail`에 `onWheel`을 달았으므로 동일 범위를 유지하려면 `railRef`를 만들고 `div.rail`에 `ref={railRef}`를 전달한다.

## Problem in the Previous Code

이전 코드는 방 전환 로직 자체보다 이벤트 등록 계층이 잘못됐다.

React 합성 이벤트의 `event.preventDefault()` API는 호출 가능하지만, 브라우저가 실제로 취소 가능한 listener로 받는지는 별개다. React DOM 19.2.3은 루트 이벤트 위임 단계에서 `wheel`, `touchstart`, `touchmove`를 passive listener로 등록한다. passive listener 안에서 `preventDefault()`를 호출하면 브라우저 기본 스크롤은 취소되지 않는다.

결과적으로 훅은 다음 세 경우에 스크롤을 막으려 하지만 실제 페이지 스크롤은 계속 진행된다.

- 휠 입력이 임계값을 넘고 cooldown 안에 들어온 경우
- 다음 방이 있어서 `nextRoomSlug`로 이동하는 경우
- 이전 방이 있어서 `previousRoomSlug`로 이동하는 경우

즉, 상태 전환은 실행되는데 기본 스크롤 취소는 실패한다.

## Evidence

- `src/shared/lib/useRoomWheelNavigation.ts`는 `event.preventDefault()`를 호출한다.
- `src/features/room/search/ui/SearchPageRoomList.tsx`는 반환된 핸들러를 `onWheel={handleWheel}`로 전달한다.
- `src/features/room/list/ui/HomeRoomStage.tsx`도 동일하게 `onWheel={handleWheel}`을 사용한다.
- 로컬 설치된 `react-dom` 버전은 `19.2.3`이다.
- `node_modules/react-dom/cjs/react-dom-client.development.js`에서 passive option 지원 여부를 검사한다.
- 같은 파일에서 `domEventName`이 `touchstart`, `touchmove`, `wheel`이면 listener option의 `passive` 값을 `true`로 설정한 뒤 `addEventListener`를 호출한다.

확인한 로컬 React DOM source 위치:

- passive option 지원 감지: `react-dom-client.development.js` lines 25146-25156
- `wheel`을 passive listener 대상으로 분기: `react-dom-client.development.js` lines 19251-19266
- `wheel` 합성 이벤트 생성: `react-dom-client.development.js` lines 19388-19390

문서화 시점에는 브라우저 수동 재현은 별도로 수행하지 않았다. 원인은 React DOM 19.2.3 소스와 현재 이벤트 연결 코드로 구조적으로 확인했다.

## Cause or Remaining Hypotheses

확정 원인: 휠 스크롤 취소가 필요한 로직을 React JSX `onWheel` 합성 이벤트에 의존했다. React DOM 19.2.3은 delegated `wheel` listener를 passive로 등록하므로 `preventDefault()`가 기본 스크롤을 막지 못한다.

남은 가설: 브라우저별 콘솔 경고 문구와 실제 스크롤 체감 정도는 viewport 높이, 페이지 overflow, 입력 장치의 delta 값에 따라 달라질 수 있다.

## Solution Options

- JSX `onWheel`을 유지한다: 코드 변경은 작지만 passive listener 문제를 해결하지 못한다.
- CSS `overscroll-behavior`로 스크롤 체인을 줄인다: 일부 스크롤 전파는 줄일 수 있지만, 방 전환 시점의 기본 wheel 동작을 조건부로 취소하는 요구를 정확히 만족하지 못한다.
- `window`나 `document`에 non-passive wheel listener를 등록한다: 취소는 가능하지만 범위가 너무 넓어 페이지 전체 스크롤과 다른 휠 상호작용을 침범한다.
- 대상 viewport DOM에만 native non-passive `wheel` listener를 등록한다: 변경 범위가 작고, 방 목록 영역 안의 휠 입력만 조건부로 소비할 수 있다.

## Chosen Solution and Rationale

대상 viewport 또는 rail DOM ref를 훅에 넘기고, 훅 내부 `useEffect`에서 native `wheel` listener를 `{ passive: false }`로 등록하는 방식을 선택한다.

이 방식은 다음 장점이 있다.

- `preventDefault()`가 실제로 기본 스크롤을 취소할 수 있다.
- listener 범위가 방 목록 DOM으로 제한된다.
- 기존 threshold, cooldown, previous/next room 판단 로직을 유지할 수 있다.
- cleanup이 hook 내부에 있어 컴포넌트가 listener 생명주기를 직접 관리하지 않아도 된다.

주의할 점은 `onSelectRoom` 참조가 자주 바뀌면 effect가 다시 등록된다는 것이다. 현재는 안전성이 더 중요하므로 dependency에 포함한다. 필요하면 호출부에서 `useCallback`으로 안정화한다.

## Result

`useRoomWheelNavigation`은 더 이상 JSX `onWheel` 핸들러를 반환하지 않는다. 훅이 대상 DOM ref를 받아 native `wheel` listener를 `{ passive: false }`로 직접 등록한다.

`SearchPageRoomList.tsx`는 `viewportRef`를 `div.viewport`에 연결했고, `HomeRoomStage.tsx`는 기존 `onWheel` 범위를 유지하기 위해 `railRef`를 `div.rail`에 연결했다.

threshold를 넘은 휠 입력이 실제 방 전환에 사용될 때 페이지 기본 스크롤도 같이 취소된다. 방 전환 상태와 페이지 스크롤이 동시에 움직이는 현상을 막을 수 있다.

## Reusable Rule

휠 입력에서 `preventDefault()`가 기능 요구사항이면 JSX `onWheel`에 의존하지 않는다. 대상 DOM ref에 native `wheel` listener를 `{ passive: false }`로 직접 등록하고, cleanup을 훅 내부에서 처리한다.

## Skill or Team Spec Updates

- skill updated: `.agents/skills/queuing-ui-flow/SKILL.md`
- team spec updated: no update because this is a UI implementation rule, not a role or handoff change.

## Verification

- `rg -n "useRoomWheelNavigation|onWheel|wheel|preventDefault" src docs .agents --glob "*.{ts,tsx,md}"`: current usages located.
- `node -p "require('./node_modules/react-dom/package.json').version"`: confirmed `19.2.3`.
- `rg -n "passive|wheel|addEventListener" node_modules/react-dom -g "*.js" -g "*.mjs"`: confirmed local React DOM delegated wheel listener path.
- `npm run lint`: passed with one existing warning in `src/features/onboarding/ui/OnboardingWizard.tsx`.
- `npm run build`: passed.
