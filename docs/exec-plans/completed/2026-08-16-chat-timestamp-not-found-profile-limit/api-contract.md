# API Contract

- 프로필 저장 API와 `UpdateMePayload` shape는 변경하지 않는다.
- `statusMessage` 필드에 UI에서 정규화된 최대 20자 최애곡 문자열을 기존과 동일하게 전달한다.
- 채팅 타임스탬프 클릭은 REST/STOMP 요청을 추가하지 않는 완전한 로컬 플레이어 동작이다.
