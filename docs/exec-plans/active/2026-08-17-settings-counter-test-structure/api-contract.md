# API Contract

- 프로필 수정 endpoint와 payload shape은 변경하지 않는다.
- 기존 문서의 backend nickname 허용 범위는 2~20자다.
- 최신 사용자 UI 요구를 우선해 client 입력·제출 검증 상한은 19자로 제한한다. 서버 범위를 확장하거나 새 fallback을 만들지 않는다.
- 음악력 query/mutation key, payload, cache synchronization은 리팩터링 전과 동일하게 유지한다.
