# UI Flow

## 채팅

1. 타인 메시지에 hover하거나 keyboard focus가 들어오면 `…` trigger가 보인다.
2. trigger를 누르면 작성자 식별자와 현재 방장 권한에 맞는 액션만 dropdown에 표시된다.
3. 팔로우/언팔로우는 현재 관계에 맞춰 한 항목만 표시한다.
4. 신고·차단은 기존 modal, 내보내기·방장 위임은 기존 room mutation을 사용한다.
5. 같은 trigger, 바깥 클릭, Escape, 채팅 스크롤은 메뉴를 닫는다.

## 프로필

1. 현재 신청자가 타인이면 프로필 카드 hover 또는 keyboard focus에서 `…` trigger를 표시한다.
2. trigger는 팔로우/언팔로우, 신고, 차단과 조건부 내보내기·방장 위임 dropdown을 연다.
3. 팔로우/언팔로우는 기존 관계 mutation을 유지한다.
4. 본인 프로필은 팔로우와 관리 액션을 표시하지 않는다.

## 채팅 합성 안정화

1. 채팅 scroll surface는 한 개만 유지한다.
2. YouTube iframe과 동적 배경까지 감싸던 상위 backdrop blur 합성 경로를 제거한다.
3. 초기 scroll-to-bottom과 이전 메시지 prepend 위치 보정은 유지한다.
