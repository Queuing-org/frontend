# 큐 연속 드래그 원본 카드 투명화

## Problem

방 큐에서 순서를 연속으로 바꾸면 항목 데이터와 자리는 남지만 원본 카드가 시각적으로 사라졌다. 보이지 않는 자리를 다시 끌어당기면 drag clone만 잠시 보였고, 새로고침 후에는 원본 카드가 복구됐다.

## Previous Behavior

- idle에서는 queue render window만 mount했다.
- drag 중에는 모든 sortable row를 mount하고 body portal의 `DragOverlay`를 함께 표시했다.
- card CSS는 drag 상태와 무관하게 `transform` 및 `opacity` transition을 항상 적용했다.
- 첫 수정은 `dropAnimation={null}`과 drag 종료 후 inline transform 미제공으로 overlay side effect를 막으려 했다.

## Previous Code

```tsx
<DragOverlay dropAnimation={null}>
  {activeEntry ? <RoomQueueCard entry={activeEntry} /> : null}
</DragOverlay>
```

```css
.item {
  transition:
    transform 180ms ease,
    opacity 180ms ease,
    box-shadow 180ms ease;
}
```

## Updated Code

```tsx
const disableLayoutAnimation = () => false;

useSortable({
  animateLayoutChanges: disableLayoutAnimation,
  disabled,
  id: entry.entryId,
});
```

`DragOverlay` portal을 제거하고 dnd-kit이 원본 sortable row를 직접 이동하게 했다. card의 일반 transition에서 `transform` 및 `opacity`를 제거했고, dragging row는 불투명 배경·그림자·상위 z-index로 표시했다.

## Problem in the Previous Code

sortable row, portal overlay, virtualization, optimistic reorder가 하나의 drag 생명주기에서 DOM 가시 상태를 나눠 소유했다. dnd-kit의 기본 overlay animation은 active 원본 노드에 `opacity: 0`을 inline으로 적용할 수 있고, sortable은 items 변경 후 derived transform을 계산한다. 동시에 card CSS도 일반 transition을 소유해 cleanup 실패 시 어느 층이 가시 상태를 복구해야 하는지 불명확했다.

## Evidence

- 사용자가 제공한 24.69초 화면 녹화를 0.5초 간격으로 프레임 추출했다.
- 0.0초에는 3개 row가 연속으로 보였지만 2.0~7.0초에는 row 자리 사이가 비었고 1개만 보였다.
- 빈 자리를 다시 drag하면 이동하는 카드는 보였다.
- 11.0초 전후의 loading 후 11.5초에 3개 row가 모두 복구됐고, 다시 연속 drag하면 같은 현상이 반복됐다.
- dnd-kit 6.3.1 로컬 소스의 기본 drop animation side effect는 active node에 `opacity: 0`을 설정한다.
- 연결 가능한 브라우저 인스턴스가 없어 최신 로컬 bundle에서 실제 포인터 drag DOM을 직접 계측하지는 못했다.

## Cause or Remaining Hypotheses

확인된 것은 데이터 소실이 아니라 drag 후 원본 DOM row의 가시 상태가 복구되지 않는 문제라는 점이다. 녹화가 `dropAnimation={null}`이 반영된 정확한 최신 bundle인지는 브라우저 연결 부재로 확인하지 못했다. 따라서 `dropAnimation={null}` 자체가 dnd-kit에서 무시됐다고 단정하지 않는다. 다만 overlay와 원본 row가 가시 상태를 나눠 소유하는 구조가 재발 경로이므로 그 경로 자체를 제거한다.

## Solution Options

- option 1: overlay를 유지하고 drag end마다 DOM style·Web Animation을 명령형으로 제거한다. 당장 증상은 숨길 수 있지만 React 밖에서 라이브러리 DOM을 재설정해 소유권이 더 불명확해진다.
- option 2: drag 종료마다 DndContext를 key로 remount한다. 시각 상태는 초기화되지만 키보드 focus와 목록 상태도 리마운트한다.
- option 3: overlay를 제거하고 원본 row만 drag하며 post-drop layout animation과 일반 transform/opacity transition을 제거한다.

## Chosen Solution and Rationale

option 3을 선택했다. 시각 상태의 owner를 원본 sortable row 하나로 줄이고, 외부 DOM cleanup이나 리마운트 없이 라이브러리의 원본-node drag 경로를 사용한다. 가상화는 drag 중 전체 mount, idle render window 계약을 유지한다.

## Result

원본 row를 투명하게 변경하는 overlay side effect 경로가 없어졌다. dragging row는 자신이 상위 layer에서 불투명하게 이동하고, drag 종료 후에는 행의 inline transform과 `data-dragging` 상태가 제거된다. 실제 브라우저 포인터 재확인은 연결 인스턴스 부재로 잔여 검증으로 남는다.

## Reusable Rule

가상화된 sortable list에서 drag clone을 추가하면 원본 row와 clone 중 누가 opacity, transform, animation을 복구하는지 명시한다. 기본은 원본 row drag로 두고, overlay가 필수인 경우에만 연속 실제 pointer drop 후 원본 row 수·투명도·inline transform·animation cleanup을 검증한다.

## Skill or Team Spec Updates

- skill updated: `queuing-ui-flow`에 가상화 sortable의 original-row drag 기본과 overlay 사용 조건을 추가했다.
- skill updated: `queuing-qa-reviewer`에 callback/prop mock만으로 drag 회귀를 판정하지 말고 원본 DOM 가시 상태를 검증하도록 추가했다.
- team spec updated: 없음. 기존 UI/QA 역할 경계 안의 세부 규은 skill에만 반영했다.

## Verification

- targeted queue/query tests: 8 files / 21 tests
- `npm run lint`
- `npm run test` — 118 files / 399 tests
- `npm run build`
- fresh read-only QA
- 잔여 위험: 연결 브라우저 부재로 실제 pointer 연속 drop 재확인은 수행하지 못함
