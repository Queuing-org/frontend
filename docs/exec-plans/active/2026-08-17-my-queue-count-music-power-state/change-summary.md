# Change Summary

- 새로고침 기본 탭에서도 개인 queue를 조회해 내 신청곡 수를 서버 `totalPendingCount`로 복원한다.
- 로딩 또는 응답 실패를 `0개`로 오인하지 않도록 `…` 상태를 추가했다.
- 음악력 버튼 hover/focus 색을 진하게 하고 현재 곡의 선택 방향을 유지한다.
- 곡이 바뀌면 선택 표시를 초기화하며, 이미 평가했거나 mutation이 pending이어도 버튼 자체는 disabled 처리하지 않는다.
- 기존 테스트를 확장해 count 복원·불명 상태와 현재 entry에 국한된 선택 상태를 검증했다.
