# UI 흐름

- TrackSearchInput가 열림/IME/활성 행/위치만 소유한다. 신청 폼의 URL과 선정 이유는 기존 useAddTrackForm이 소유한다.
- 자동 포커스/빈 값은 frequent, trim 제목은 300ms 이후 YouTube. URL 및 URL처럼 보이는 잘못된 값은 검색하지 않는다.
- 목록 선택은 URL 변경과 닫기만 수행. 실제 전송은 기존 큐잉 버튼.
- body portal fixed 위치에 입력 너비와 하단 좌표를 사용하고 viewport 잔여 높이를 max-height로 적용. 방향키/Enter/Tab/바깥 클릭/Escape 지원. Escape는 열린 목록부터 소비한다.
- 행 48px, 아이콘 20px/간격12px/좌우16px. 검색 썸네일32px/radius4px. 제목16px regular, 채널14px #555555. 축소 모드80%.
- 공통 marquee는 hover와 활성 행에서만 순환. reduced-motion에서는 animation none, 수동 가로 스크롤.
- 입력/재생목록 영역에서 선정 이유까지 기존 40px CSS 간격 유지.
- 친구 상태는 확인된 online/room으로만 표시. 오프라인이면 stale room 숨김.
- 친구 프로필300×431/240×344.8, shell contentPadding=none으로 패딩 소유권 일원화. 패널 내용은 항상 세로 스크롤 가능하여 큰 통계도 접근 가능.
- 닉네임은 방 캐시와 profile fallback context, 고정 본인 참가자 표시 및 chat 표시 투영에 반영. 원본 chat/식별자/scrollToLatestKey 유지.
