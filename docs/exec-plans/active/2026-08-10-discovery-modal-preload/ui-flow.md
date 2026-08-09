# UI Flow

1. 홈·검색 화면 mount 뒤 브라우저 idle callback에서 CREATE·FOLLOW·SETTING chunk를 낮은 우선순위로 요청한다.
2. 사용자가 데스크톱 메뉴 항목 또는 모바일 빠른 메뉴 버튼에 hover·focus·pointer intent를 주면 해당 chunk를 즉시 요청한다.
3. 사용자가 클릭하면 인증을 확인한 뒤 동일 preload promise 완료를 기다린다.
4. chunk가 준비된 다음에만 modal open state를 변경하므로 page-level loading dialog는 표시하지 않는다.
5. 첫 요청부터 modal을 닫을 때까지 해당 modal이 discovery modal slot을 예약해 느린 네트워크에서도 다른 modal이 겹쳐 열리지 않게 한다.
6. 이미 받은 chunk는 promise와 브라우저 module cache를 재사용한다. 실패한 promise는 비워 다음 동작에서 재시도하고, 실제 클릭 실패만 접근 가능한 오류 문구로 표시한다.
