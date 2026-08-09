# API Contract

- 검색: 기존 `GET /api/v1/user-profiles?query=...`와 `useSearchUsers`를 재사용한다.
- 선택 후 표시값은 `nickname`, mutation 식별자는 공개 식별자인 `slug`를 사용한다.
- 팔로우: 기존 follow mutation을 재사용한다.
- mutation 성공 시 기존 `followKeys.all()` 및 `userKeys.searchRoot()` 무효화가 유지된다.
- 이미 팔로우 중인 사용자도 언팔로우 동작으로 전환하지 않고 follow mutation의 서버 오류 메시지를 표시한다.
