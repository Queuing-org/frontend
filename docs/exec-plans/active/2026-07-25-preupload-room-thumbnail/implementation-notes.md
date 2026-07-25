# Implementation Notes

## API

- `uploadTemporaryRoomThumbnail`은 `FormData`의 `file` 필드로 `POST /api/v2/rooms/thumbnail`을 호출한다.
- 응답의 `uploadToken`이 비어 있으면 방 생성 단계를 영구 차단하지 않도록 명시적인 `ApiError`로 변환한다.
- 임시 업로드는 아직 방 서버 상태를 만들지 않으므로 React Query cache invalidation을 하지 않는다.
- 기존 방 수정용 `uploadRoomThumbnail` PUT과 invalidation 흐름은 유지한다.

## UI

- 파일 선택 hook이 로컬 검증을 통과한 `File`을 반환하고, 생성 모달이 즉시 upload mutation을 시작한다.
- 업로드 중에는 썸네일 입력과 단계 이동을 막지만 방 제목 입력은 유지한다.
- 진행/완료는 `role="status"`, 실패는 `role="alert"`로 썸네일 입력 근처에 표시한다.
- 재선택과 선택 제거는 이전 mutation data/error를 reset해 오래된 token이 생성 payload에 들어가지 않게 한다.
- 방 생성 실패 시 성공한 임시 token을 유지해 생성 요청만 재시도할 수 있다.
- 생성 후 PUT과 실패 시 방 DELETE 롤백을 제거했다.
- 생성·수정 폼은 `ROOM_TAG_LIMIT = 3`을 공유해 선택 방어, 카운터, 칩 disabled 상태가 같은 제약을 사용한다.
- 수정 폼은 초기 태그와 저장 비교 기준을 첫 3개로 정규화하되, 태그를 직접 바꾸지 않은 수정에서는 서버의 기존 초과 태그를 자동 삭제하지 않는다.

## Tests

- multipart endpoint와 `file` 필드
- 필수 `uploadToken` 누락 응답
- 파일 선택 즉시 업로드 및 409 오류 표시
- 업로드 중 입력/단계 잠금 범위
- 실패 후 재선택 복구
- 성공 token의 생성 payload 전달
- 성공 후 선택 제거 시 token 제거
- 썸네일 없는 기존 생성 흐름
- 생성 폼의 `0/3`·`3/3` 카운터, 네 번째 태그 비활성화, create payload
- 수정 폼의 초기 태그 정규화, 네 번째 태그 추가 방어, 카운터와 disabled 상태

## Build Evidence

- `npm run lint`: pass
- `npm run test`: 15 files, 47 tests pass
- 태그 제한 targeted tests: 2 files, 9 tests pass
- `npm run build`: pass
- `git diff --check`: pass
