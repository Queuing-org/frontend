# Change Summary

- drag overlay drop animation과 drag 종료 후 잔류 inline transform을 제거해 행이 투명해지거나 유령 공백으로 남는 현상을 막았다.
- 큐 이동 mutation을 authoritative reset/refetch 완료까지 pending으로 유지하고, 전체/내 신청곡 두 탭을 같이 잠그도록 했다.
- query invalidation scheduler에 key별 revision을 두어 in-flight 실시간 이벤트가 최신 순서를 놓치지 않게 했다.
- 이동 실패나 개인 이동 제약 시 로컬 임시 순서를 정리해 rollback된 순서를 다시 덮지 않게 했다.
