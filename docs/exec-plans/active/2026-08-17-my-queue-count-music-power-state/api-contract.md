# API Contract

- 내 신청곡 수는 전체 queue의 현재 페이지나 로컬 추가 횟수로 계산하지 않고 `GET /api/v1/rooms/{roomSlug}/queue-entries/me` 첫 페이지의 `totalPendingCount`를 사용한다.
- 로그인 사용자의 개인 queue query는 기본 `all` 탭에서도 활성화해 새로고침 직후 count를 복원한다.
- 인증 또는 개인 queue 응답이 아직 없거나 조회가 실패한 상태는 성공한 `0`으로 가장하지 않고 `null`로 유지해 UI가 `…`를 표시한다.
- 음악력 선택 표시는 현재 재생 `entryId`와 서버/로컬 vote 상태를 기준으로 하며 새 API 계약을 만들지 않는다.
- mutation pending 표시는 같은 `roomSlug`·`entryId`·`targetUserSlug` 요청에만 적용한다.
