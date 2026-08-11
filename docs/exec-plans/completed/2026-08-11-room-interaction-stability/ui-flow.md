# UI Flow

- 참가자 panel은 이전 desktop compact breakpoint만 사용하고 다른 floating panel은 변경하지 않는다.
- 채팅 관리 메뉴는 viewport portal로 열리고 anchor가 보이는 동안 스크롤 위치를 따라간다.
- 최신 채팅을 보고 있을 때 메시지 실제 높이가 변하면 다시 최하단에 맞춘다.
- 현재 곡은 신청자와 곡 제목이 자동으로, 재생목록은 hover/focus에서 함께 marquee 된다.
- 팔로우 내부 portal 클릭은 바깥 FRIEND modal을 닫지 않는다.
- 이미 팔로우 관계인 검색 사용자는 네트워크 요청 없이 안내한다.
