# Change Summary

- 방 프로필 상태·팔로우·관리 컨트롤을 동일 비율로 맞추고 채팅 fade buffer와 equalizer 폭을 정리했다.
- 닉네임과 한 줄 메시지를 단일 form/mutation/완료 버튼으로 통합하고 payload 조합, 고정 feedback, 정확한 2초 대상 필드 테두리와 IME 처리를 추가했다.
- 프로필 저장과 칭호 변경의 mutation reset race를 차단하고 오류 우선순위와 focus-visible을 보강했다.
- 방 생성 최대 인원을 필수 dropdown으로 바꾸고 참여 제한을 password input과 같은 자리를 쓰는 disclosure control로 개편했다.
- 공개 전환 중 password draft를 보존하되 password mode payload에만 포함하도록 했다.
- 모든 생성 단계 이동을 monotonic `visitStep`으로 통일해 방문한 단계 재진입과 전체 입력값 보존을 보장했다.
- API client, backend contract, 공용 payload type은 변경하지 않았다.
