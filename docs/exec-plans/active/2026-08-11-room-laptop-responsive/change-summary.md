# Change Summary

- 채팅 상단 페이드를 104px로 넓히고 8px 투명 버퍼를 유지했다.
- 기존 80% room compact를 가로 폭 제한 대신 짧은 데스크톱 높이 기준으로 확장했다.
- 1920x800 플로팅 패널 geometry와 storage mode가 compact로 동작하도록 공용 density 판정을 동기화했다.
- 플레이어 empty/error 상태와 플로팅 채팅 내부 여백의 compact 누락을 보강했다.
- 방 밖 화면의 부분 compact 회귀를 막기 위해 공용 `RoomInfo`와 spinner 범위를 제한했다.
