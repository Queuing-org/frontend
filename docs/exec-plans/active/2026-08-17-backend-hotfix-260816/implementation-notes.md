# Implementation Notes

## Join transition ownership

- `useRoomJoinTransition`이 이동 전 join, 충돌 상태, socket session lease, 확인 재요청, 복귀 이동을 소유한다.
- 첫 요청과 확인 요청은 정규화한 동일 target slug/password를 사용한다.
- discovery 성공 결과는 15초짜리 메모리 handoff로 방 화면에 넘겨 중복 join을 막고, 방 subscription 초기화 뒤 lease를 해제한다.
- direct URL은 같은 transition hook을 사용하되 handoff 없이 현재 화면에서 join 결과를 적용한다.
- `RoomJoinError`만 기존 방 `slug/title`을 보존하며 둘 중 하나가 비어 있으면 충돌 모달로 승격하지 않는다.

## UI ownership

- 홈과 검색은 `useRoomEntry`를 공유하고 각 화면이 비밀번호·충돌 dialog를 조립한다.
- 충돌 dialog는 삭제·leave dialog와 분리했으며, return/backdrop/Escape를 기존 방 복귀 한 동작에 연결한다.
- 생성 owner conflict는 생성 폼을 닫지 않고 서버 문구 우선 오류만 표시한다.
- leave dialog는 publish 성공 뒤 500ms 동안 pending을 유지한 다음 홈으로 이동한다.

## Queue

- 서버 상태명은 `ownerOrdered`로 교체했다.
- 개인 reorder 모델과 optimistic update는 모든 pending entry ID를 사용한다.
- sortable UI에서 개인 pending 잠금 분리와 전용 오류 알림을 제거했다.

## Review regressions

- 동일 feedback key 갱신은 `createdAt`을 갱신하고 스택 맨 앞으로 이동한다.
- guest kick은 `participantId`를 mutation target과 feedback key에 동일하게 사용한다.
- 방 정보 저장 뒤 thumbnail만 반복 실패해도 부분 저장 안내 상태를 보존한다.
