# UI Flow

## 방 내부 목록

- 채팅, 참가자, 재생목록의 기존 실제 scroll container에 Firefox `scrollbar-width: none`과 WebKit scrollbar 숨김을 적용했다.
- 세 container는 `tabIndex=0`과 focus-visible outline을 가져 키보드 스크롤 진입점을 유지한다.
- 채팅 DOM은 과거→최신 순서를 유지하고 list를 column flex로 바꾼 뒤 message list에만 `margin-top:auto`를 적용한다.
- 상단 페이드는 panel root pseudo-element이며 열린 message row의 z-index가 더 높다.

## FOLLOW 상세

- `FollowModal`이 선택 사용자와 카드 trigger를 소유한다.
- following/follower list는 사용자와 실제 button trigger만 상위로 전달하고 펼침 액션 상태를 갖지 않는다.
- `FollowProfileModal`은 300×380(일반), 240×304(compact) 상세를 중첩하고 공통 `UserProfileContent`를 사용한다.
- 상세의 관리 menu는 차단만 제공한다. `BlockUserModal` 성공 시 기존 mutation hook이 follow/search cache를 갱신하고 상세를 닫는다.
- 차단 확인 dialog는 discovery dock보다 높은 layer를 사용해 중첩 확인 중 배경 control이 앞에 나오지 않는다.
- 닫기, 바깥 pointer, Escape는 같은 close callback을 사용하며 다음 frame에 원래 카드로 focus를 복원한다.

## 탐색·생성

- desktop discovery modal 동안 dock은 modal보다 높은 stacking level에 남는다.
- `isNavigationLocked`일 때 좌우 slot은 비고 center entry만 disabled이며 MENU/FILTER는 그대로 동작한다.
- mobile quick menu 코드는 변경하지 않았다.
- 생성 form은 `furthestVisitedStep`을 별도로 소유해 현재 step과 방문 가능 범위를 분리한다. 각 input은 기존 create modal state를 계속 사용한다.
