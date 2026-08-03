# Request Summary

- backend-core v26.8.0-beta.1 프론트 변경 안내 전체를 반영한다.
- queue 전체 선조회 대신 구간 조회와 `totalPendingCount`를 사용한다.
- owner locked 개인 곡 이동을 금지한다.
- rooms legacy `lastId`와 비공개 식별 fallback을 제거한다.
- join/access/session replacement/thumbnail 계약을 엄격히 적용한다.
- 특정 계정 백엔드 상태 문제를 해결하려고 추가했던 프론트 방 입장 우회 코드를 제거한다.
