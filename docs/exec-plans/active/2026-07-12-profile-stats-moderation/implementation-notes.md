# Implementation Notes

- `User`와 `UserProfile`의 통계는 배포 전후 응답 호환을 위해 선택 필드로 유지한다.
- 음악력 전용 query는 공개 프로필 값보다 우선하며 추천 성공 시 두 캐시를 함께 갱신한다.
- 차단은 `follow/blocked`, 신고는 `room/chat` feature가 소유한다.
- 차단 성공은 관계/검색 캐시를 무효화하고, 신고 성공은 채팅 데이터를 바꾸지 않고 모달만 닫는다.
- 채팅 메뉴 권한은 `getChatMessageManagementActions` 순수 함수가 판단하고 `ChatArea`는 열린 메뉴/모달 대상만 소유한다.
- 신고 사유 원문이 제공되지 않아 네 문구를 상수로 격리했다. 디자인 원문 확인 시 상수만 교체하면 된다.
