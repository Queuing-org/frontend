# UI Flow

## Ownership

- `EditRoomFormModal`: edit 전용 participation menu open state와 기존 password 상태의 UI 변환을 소유한다.
- `useEditRoomForm`: draft, validation, thumbnail upload, submit orchestration을 계속 소유한다.
- `buildUpdateRoomPayload`: changed-field PATCH 의미를 계속 소유한다.

## Layout

- 상단: bordered `EDIT` pill, `큐 삭제`, 닫기
- 본문: 중앙 thumbnail → 큐 이름 → 큐 장르 → 최대 인원 → 참여 제한 → feedback
- 하단: full-width dark `편집 완료` button

## Participation

- 화살표만 menu를 열고 바깥 pointer/Escape로 닫는다.
- 공개 모드는 read-only `누구나 참여`를 보여준다.
- 비밀번호 모드는 password input을 보여준다.
- 기존 비밀번호 방은 새 값을 입력하지 않으면 기존 비밀번호를 유지한다.
- 공개 전환은 기존 비밀번호를 해제하는 명시적 intent다.
