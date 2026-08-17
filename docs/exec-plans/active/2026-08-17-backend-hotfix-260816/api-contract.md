# API Contract

## Room join

- 첫 join은 목적지로 이동하기 전 현재 화면에서 전송한다.
- `room.already-participating`의 `ERROR.data.slug/title`은 전용 오류가 보존한다.
- 유효한 기존 방 정보가 있을 때만 확인 모달을 연다.
- 확인 join은 같은 socket session lease에서 최초 target slug/password를 그대로 재전송한다.
- 새 방 join 성공 전에는 기존 방 leave를 보내지 않는다.

## REST

- 랜덤 방: `GET /api/v1/rooms/random`, 성공 응답의 `result.slug`만 사용한다.
- 후보 없음: 서버 메시지 우선 파란 안내.
- 방 생성 owner conflict: 서버 메시지 우선 빨간 안내, 생성 모달과 입력을 유지한다.
- 명시적 leave 성공 후 홈 이동은 500ms 지연한다.

## Queue

- `PlaylistEntryStatus.ownerOrdered`는 서버 표시 상태로만 보존한다.
- 개인 reorder의 PATCH `beforeEntryId`와 optimistic order는 소유한 전체 pending 곡을 사용한다.
- `room.queue-entry-order-locked`는 더 이상 지원하지 않는다.
