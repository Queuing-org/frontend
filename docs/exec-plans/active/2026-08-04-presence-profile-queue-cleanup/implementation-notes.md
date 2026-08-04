# Implementation Notes

- follower/following wrapper가 feature-owned `FollowPresenceCard`를 공유하도록 변경했다. 카드 전용 언팔로우 UI는 제거했지만 방 프로필의 `FollowToggleButton`이 쓰는 unfollow API/hook은 유지했다.
- 음악력 UI는 `myVote`를 렌더 상태에 사용하지 않고 UP/DOWN PUT만 실행한다. DELETE 취소 client/hook과 selected 스타일을 제거했다.
- 대표 칭호 설정/해제는 공용 invalidator로 내 칭호, 내 정보, 공개 칭호, 공개 profile cache를 함께 재검증한다. DELETE의 boolean 결과도 검증한다.
- queue history API/query/type/UI와 실시간 무효화를 제거했다.
- 이미 조회한 playback `currentEntry`를 mobile/floating queue panel에 전달하고 전체 queue 선두에 active 상태로 중복 없이 합쳤다. queue pending count와 내 신청곡은 바꾸지 않았다.
- fresh QA의 공개 profile cache 누락과 false boolean 처리 지적을 한 번의 fix pass로 반영했다.
