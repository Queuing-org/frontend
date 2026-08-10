# API Contract

## 프로필 저장

- 닉네임만 변경: `{ nickname: trimmedNickname }`
- 메시지만 변경: `{ nickname: currentNickname, statusMessage }`
- 두 필드 변경: `{ nickname: trimmedNickname, statusMessage }`
- 단일 `useUpdateMe` mutation 호출을 사용하고 기존 `me` query invalidation을 유지한다.
- 칭호 mutation은 프로필 완료 버튼과 분리해 기존처럼 select change 즉시 실행한다.

## 방 생성

- `maxParticipants`는 UI에서 필수 선택하며 기존 numeric field에 선택값을 전달한다.
- `password`는 password 모드이고 trim한 값이 있을 때만 기존 payload에 포함한다.
- 공개 모드 전환은 local password draft만 보존하고 payload에는 포함하지 않는다.
- 공용 request type과 API client는 변경하지 않는다.
