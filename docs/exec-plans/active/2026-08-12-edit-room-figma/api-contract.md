# API Contract

- room info update, thumbnail replacement, room delete mutation/hook은 변경하지 않는다.
- 기존 비밀번호가 있는 방:
  - `비밀번호 입력` 유지 + 새 값을 입력하지 않음: password field 미전송
  - 새 비밀번호 입력: password에 trim한 새 문자열 전송
  - `누구나 참여` 선택: password에 `null` 전송
- 기존 비밀번호가 없는 방:
  - 기본 `누구나 참여`: password field 미전송
  - `비밀번호 입력` 선택: 빈 값 제출을 막고 새 문자열 전송
- 모든 PATCH payload는 기존 `buildUpdateRoomPayload`가 현재 non-empty title을 포함한다.
