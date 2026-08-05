# UI Flow

1. 프로필 패널을 열면 avatar, nickname, 방장 crown, 현재 큐잉 상태를 본다.
2. 대상이 로그인 사용자 본인이 아니면 다음 줄에서 팔로우 관계와 `관리`를 본다.
3. `관리`를 누르면 버튼 바로 아래에 focus가 신고에 놓인 dropdown menu가 열린다.
4. Escape는 dropdown을 닫고 관리 버튼으로 focus를 돌리며, 바깥 클릭도 dropdown을 닫는다.
5. 신고는 대상의 최신 신고 가능한 채팅 `messageKey`로 기존 채팅 신고 모달을 열고 같은 신고 API를 사용한다.
6. 현재 불러온 채팅에 대상 메시지가 없으면 신고 요청을 만들지 않고 패널 status로 안내한다.
7. 차단은 기존 확인 dialog를 열어 실제 차단 mutation을 실행한다.
8. 현재 사용자가 방장이고 대상이 본인/방장이 아니면 내보내기를 표시해 기존 kick mutation을 실행한다.
