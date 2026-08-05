# API Contract

## 프로필 신고

- 새 사용자 신고 endpoint를 추가하지 않는다.
- 현재 불러온 방 채팅 중 대상 사용자 `senderSlug`와 일치하는 가장 최근 메시지의 `messageKey`를 선택한다.
- 기존 `ReportChatMessageModal`과 `useReportChatMessage`를 그대로 사용한다.
- 요청 경로는 `POST /api/v1/rooms/{slug}/chat-messages/{messageKey}/reports`다.
- 비공개 방이면 현재 방 비밀번호를 기존 채팅 신고 계약과 동일하게 전달한다.
- 사용할 `messageKey`가 없으면 네트워크 요청을 보내지 않는다.

## 차단과 내보내기

- 차단은 기존 사용자 차단 확인 모달과 mutation을 재사용한다.
- 내보내기는 기존 방 참가자 내보내기 mutation을 재사용하고, 공개 `slug` 기준으로 현재 사용자가 방장일 때만 노출한다.
