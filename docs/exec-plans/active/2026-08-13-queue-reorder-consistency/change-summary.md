# Change Summary

- `DragOverlay`를 완전히 제거하고 원본 sortable row만 직접 이동하게 해 원본과 clone 사이의 opacity cleanup 경합을 없앴다.
- post-drop layout animation과 card의 일반 transform·opacity transition을 제거해 종료 뒤 유령 공백과 투명 row가 남는 경로를 차단했다.
- 큐 이동 mutation을 authoritative reset/refetch 완료까지 pending으로 유지하고, 전체/내 신청곡 두 탭을 같이 잠그도록 했다.
- query invalidation scheduler에 key별 revision을 두어 in-flight 실시간 이벤트가 최신 순서를 놓치지 않게 했다.
- 이동 실패나 개인 이동 제약 시 로컬 임시 순서를 정리해 rollback된 순서를 다시 덮지 않게 했다.
