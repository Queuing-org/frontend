# UI Flow

## 연속 순서 변경

1. 별도 `DragOverlay` clone을 만들지 않고 원본 sortable row 하나만 이동한다.
2. drag 중에는 원본 row에만 정렬 transform·불투명 배경·상위 z-index·그림자를 적용하고, drag 종료 즉시 inline transform과 transition을 제거한다.
3. post-drop layout animation과 card의 일반 `transform`·`opacity` transition을 사용하지 않아 원본 row에 투명도나 derived transform이 남을 경로를 없앤다.
4. drop 직후에는 로컬 optimistic order를 보이고 전체/내 신청곡 query cache에도 같은 순서를 적용한다.
5. API 응답 후 authoritative reset/refetch가 완료될 때까지 두 탭의 drag를 모두 잠그다.
6. 성공·실패 모두 동기화 완료 후 로컬 optimistic order를 제거하며, 실패는 snapshot과 서버 순서로 복구한다.

## 기존 제약

- 방장이 고정한 `ownerOrderLocked` 항목은 `내 신청곡`에서 계속 이동할 수 없다.
- 미로드 페이지가 있을 때 현재 로드 구간 끝 밖으로 이동하는 제약은 유지한다.
