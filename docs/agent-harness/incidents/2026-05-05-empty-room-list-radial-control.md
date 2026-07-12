# Empty Room List Radial Control Hidden

## Problem

홈 화면과 검색 화면에서 하단 원형 컨트롤이 갑자기 사라졌다.

## Previous Behavior

홈은 `currentRoom`, 검색은 `selectedRoomSlug`가 있을 때만 원형 컨트롤을 렌더링했다. 서버 방 목록이 비면 방 이동, 방 입장뿐 아니라 `MENU`와 `CREATE` 진입점까지 같이 사라졌다.

## Previous Code

```tsx
{currentRoom ? (
  <div className={styles.controlWrap}>
    <RadialControl center={<Link href={`/room/${selectedRoomSlug}`} />} />
  </div>
) : null}
```

```tsx
{!isLoading && !isError && selectedRoomSlug ? (
  <div className={styles.controlWrap}>
    <RadialControl center={<Link href={`/room/${selectedRoomSlug}`} />} />
  </div>
) : null}
```

## Updated Code

```tsx
<div className={styles.controlWrap}>
  <RadialControl
    center={
      selectedRoomSlug ? (
        <Link href={`/room/${encodeURIComponent(selectedRoomSlug)}`} />
      ) : (
        <button type="button" disabled aria-label="입장할 방 없음" />
      )
    }
  />
</div>
```

## Problem in the Previous Code

원형 컨트롤은 방 이동 컨트롤이기도 하지만 메뉴와 방 생성 진입점도 같이 가진다. 방 목록이 비었다는 이유로 컨트롤 전체를 숨기면, 빈 상태에서 가장 필요한 `CREATE` 동선까지 사라진다.

## Evidence

`GET https://api.queuing.cc/api/v1/rooms` 응답:

```json
{ "result": { "rooms": [], "hasNext": false } }
```

동일 API 응답에서 홈의 `currentRoom`과 검색의 `selectedRoomSlug`가 모두 `null`이 되어 기존 조건이 false가 된다.

## Cause or Remaining Hypotheses

확정 원인: 서버가 빈 방 목록을 내려줄 때 클라이언트 조건부 렌더링이 원형 컨트롤 전체를 숨겼다.

남은 가설: 서버 방 목록이 왜 비어졌는지는 이 변경에서 다루지 않았다.

## Solution Options

- 빈 방 목록에서도 원형 컨트롤을 렌더링하고 방 의존 액션만 disabled 처리한다.
- 빈 상태 전용 CTA를 별도로 만든다.
- 서버가 샘플 방을 항상 유지하게 한다.

## Chosen Solution and Rationale

원형 컨트롤을 유지하고 중앙 입장 버튼만 disabled 처리했다. 기존 홈/검색 조작 모델을 유지하면서 `MENU`와 `CREATE` 접근성을 복구할 수 있어서 변경 범위가 가장 작다.

## Result

방 목록이 비어도 홈과 검색 화면에서 원형 컨트롤이 보인다. 이전/다음/입장은 disabled 상태가 되고, 메뉴와 필터 패널은 그대로 열 수 있다.

## Reusable Rule

빈 서버 상태 때문에 공유 컨트롤 전체를 숨기지 않는다. 방 데이터가 필요한 액션만 disabled 처리하고, 방 생성이나 메뉴처럼 빈 상태에서 필요한 액션은 유지한다.

## Skill or Team Spec Updates

- Updated: `.agents/skills/queuing-ui-flow/SKILL.md`
- Team spec update: not needed

## Verification

- `npm run lint`: passed with 3 existing warnings
- `npm run build`: passed
