# Search Room Card Inline Handler Refactor

## Problem

`SearchPageRoomList.tsx`가 검색 방 목록을 렌더링할 때 `rooms.map(...)` 안에서 카드별 `onClick={() => onRequestRoomEntry(room)}` 함수를 새로 만들었다.

사용자에게 바로 보이는 기능 버그는 아니지만, 방 목록 부모가 필터/모달/선택 상태 등으로 다시 렌더링될 때 모든 카드의 `onClick` prop 참조가 바뀐다. 이 구조는 `SearchPageRoomCard`를 `React.memo`로 감싸도 부모 렌더마다 memo 효과를 무력화할 수 있는 성능 리스크다.

## Previous Behavior

부모 리스트가 각 방 카드에 표시용 prop과 클릭용 람다를 모두 만들어 넘겼다.

카드는 `onClick` prop을 그대로 버튼에 연결했다. 카드 내부는 어떤 방을 요청하는지 모르고, 부모가 만든 per-item closure에 의존했다.

## Previous Code

```tsx
{rooms.map((room) => (
  <SearchPageRoomCard
    key={room.id}
    slug={room.slug}
    title={room.title}
    tag={room.tags}
    isSelected={room.slug === selectedRoomSlug}
    onClick={() => onRequestRoomEntry(room)}
  />
))}
```

```tsx
type Props = {
  slug: string;
  title: string;
  tag: RoomTag[];
  isSelected: boolean;
  onClick: () => void;
};

export default function SearchPageRoomCard({ onClick, ...props }: Props) {
  return <button type="button" onClick={onClick}>...</button>;
}
```

## Updated Code

부모는 방 객체와 안정화 가능한 상위 핸들러만 넘긴다. 카드가 클릭 문맥을 소유한다.

```tsx
{rooms.map((room) => (
  <SearchPageRoomCard
    key={room.id}
    room={room}
    isSelected={room.slug === selectedRoomSlug}
    onRequestRoomEntry={onRequestRoomEntry}
  />
))}
```

카드는 `room`에서 표시 데이터를 읽고, 버튼 클릭은 내부 `useCallback`으로 묶는다. 카드도 `memo`로 감싸 부모의 무관한 재렌더 영향을 줄였다.

```tsx
function SearchPageRoomCard({
  room,
  isSelected,
  onRequestRoomEntry,
}: Props) {
  const { slug, title, tags } = room;
  const handleClick = useCallback(() => {
    onRequestRoomEntry(room);
  }, [onRequestRoomEntry, room]);

  return (
    <button type="button" onClick={handleClick}>
      ...
    </button>
  );
}

export default memo(SearchPageRoomCard);
```

상위에서 내려오는 `onRequestRoomEntry` 자체도 무관한 부모 렌더마다 바뀌지 않도록 `useRoomEntry` 내부 반환 함수를 `useCallback`으로 감쌌다.

```ts
const requestRoomEntry = useCallback((room: Room) => {
  if (room.slug !== selectedRoomSlug) {
    onSelectRoom(room.slug);
    return;
  }

  if (room.isPrivate) {
    setPasswordRoom(room);
    return;
  }

  router.push(`/room/${encodeURIComponent(room.slug)}`);
}, [onSelectRoom, router, selectedRoomSlug]);
```

## Problem in the Previous Code

문제는 함수 생성 자체가 비싼 것이 아니다. 진짜 문제는 참조 안정성이 깨져 memoization 경계를 만들 수 없다는 점이다.

이전 구조에서는 부모가 다시 렌더링될 때마다 각 카드의 `onClick` prop이 새 함수가 된다. 그러면 카드의 표시 데이터가 그대로여도 shallow comparison 기준으로 prop이 바뀐 것으로 보인다. 결과적으로 `React.memo(SearchPageRoomCard)`를 적용해도 `onClick` 때문에 모든 카드가 다시 렌더링될 수 있다.

또한 방 입장 로직이 부모의 map closure에 숨어 있어서 카드의 책임 경계가 애매했다. 카드는 방 카드이면서도 자기 클릭이 어떤 방을 요청하는지 직접 알지 못했다.

## Evidence

- CodeRabbit review가 `SearchPageRoomList.tsx`의 `rooms.map(...)` 내부 inline handler를 지적했다.
- 현재 코드 확인 결과 `SearchPageRoomCard` 사용처는 `src/features/room/search/ui/SearchPageRoomList.tsx` 한 곳뿐이라 API 변경 범위가 작았다.
- `SearchPageRoomCard`는 기존에 memoized component가 아니었으나, 지적 내용은 향후 `React.memo` 적용 시 바로 문제가 되는 구조였다.
- 별도 React Profiler 측정은 하지 않았다. 이번 기록은 런타임 병목 확정이 아니라 구조적 memoization 리스크 제거 기록이다.

## Cause or Remaining Hypotheses

확정 원인: 부모 리스트가 item별 클릭 문맥을 inline closure로 만들면서 카드 prop 참조 안정성을 깨뜨렸다.

남은 가설: 실제 체감 성능 차이는 방 개수, React Query의 `rooms` 배열 참조 안정성, 선택 상태 변경 빈도에 따라 달라진다. 이번 변경은 미세 성능 수치보다 memoization 가능한 컴포넌트 경계를 만드는 데 목적이 있다.

## Solution Options

- 기존 inline handler 유지: 변경이 없지만 카드 memoization을 적용해도 `onClick` 때문에 효과가 약해진다.
- 부모에서 `useCallback`으로 `handleRequestRoomEntry`만 감싸기: map 안에서 `() => handleRequestRoomEntry(room)`를 계속 만들면 카드별 함수 참조 문제는 남는다.
- 부모에서 room id별 callback map을 `useMemo`로 만든다: prop 안정성은 얻을 수 있지만 코드가 복잡하고 room 목록 변경 시 캐시 무효화 관리가 필요하다.
- 카드에 `room`과 `onRequestRoomEntry`를 넘기고 카드 내부에서 클릭을 묶는다: 변경 범위가 작고 카드가 자기 클릭 문맥을 소유한다.
- 카드에 `slug`만 넘기고 부모에서 slug로 room을 다시 찾는다: 전달 데이터는 줄지만 클릭 시 room lookup이 추가되고 password/private 판단에 필요한 원본 room을 다시 조립해야 한다.

## Chosen Solution and Rationale

`room` 객체와 안정화 가능한 `onRequestRoomEntry`를 카드에 넘기고, 카드 내부에서 클릭 핸들러를 묶는 방식을 선택했다.

선택 이유는 다음과 같다.

- 부모 `map`에서 per-item inline closure가 사라진다.
- 카드가 자기 room context를 직접 가지므로 책임 경계가 명확하다.
- `SearchPageRoomCard` 사용처가 하나뿐이라 API 변경 리스크가 작다.
- `memo(SearchPageRoomCard)`를 적용할 수 있는 prop 구조가 된다.
- `useRoomEntry`의 반환 핸들러도 `useCallback`으로 안정화해 필터/모달 상태 같은 무관한 부모 렌더에 덜 흔들린다.

주의할 점: `requestRoomEntry`는 `selectedRoomSlug`에 의존한다. 선택 방이 바뀌면 핸들러 참조도 바뀐다. 이건 버그가 아니라 현재 동작 요구사항이다. 이번 개선은 선택 변경이 아닌 무관한 부모 렌더에서 카드 렌더를 줄이기 위한 구조 정리다.

## Result

`SearchPageRoomList.tsx`에서 `onClick={() => onRequestRoomEntry(room)}`가 제거됐다.

`SearchPageRoomCard`는 `room`, `isSelected`, `onRequestRoomEntry`를 받아 내부 `handleClick`을 만들고 `memo`로 export한다.

`useRoomEntry`는 `requestRoomEntry`, `closePasswordModal`, `completePasswordEntry`를 `useCallback`으로 반환한다.

## Reusable Rule

리스트 부모의 `map` 안에서 카드별 inline callback을 만들지 않는다. 카드가 item context를 가질 수 있으면 item과 안정화된 상위 핸들러를 넘기고, 카드 내부에서 클릭을 바인딩한다.

## Skill or Team Spec Updates

- skill updated: `.agents/skills/queuing-ui-flow/SKILL.md`
- team spec updated: no update because this is a UI implementation rule, not a role or handoff boundary.

## Verification

- `npm run lint`: passed with one existing warning in `src/features/onboarding/ui/OnboardingWizard.tsx` for unused `setStep`.
- `npm run build`: passed.
