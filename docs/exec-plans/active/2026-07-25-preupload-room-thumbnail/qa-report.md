# QA Report

## Result

`pass`

차단 finding 없음.

## Boundary Review

- API: `POST /api/v2/rooms/thumbnail`에 `FormData(file)`을 전달하고 `ApiResponse`를 unwrap한다.
- Response: 방 생성에 필요한 `uploadToken`이 없으면 명시적인 계약 오류로 처리한다.
- Create payload: 최신 성공 token만 `thumbnailUploadToken`으로 전달한다.
- Cache: 임시 업로드는 방 서버 상태를 만들지 않아 invalidate하지 않고, 방 생성 성공의 기존 목록 invalidate는 유지한다.
- UI: 파일 선택 즉시 mutation을 시작하고 pending/error/token 상태로 기본 정보 단계 이동을 제어한다.
- Recovery: 실패 후 재선택, 성공 후 선택 제거가 이전 error/data/token을 reset한다.
- Edit isolation: 기존 방 수정은 계속 `PUT /api/v1/rooms/{slug}/thumbnail`과 기존 invalidation을 사용한다.
- Rollback removal: 생성 경로에서 생성 후 PUT과 실패 DELETE 롤백이 제거됐다.
- Tag limit: 생성·수정 폼이 공통 `ROOM_TAG_LIMIT = 3`을 사용한다.
- Create UI: 선택 방어, `n/3` 카운터, 미선택 칩 disabled, create payload를 확인했다.
- Edit UI: 초기값·저장 비교 기준 정규화, 선택 방어, `n/3` 카운터, 미선택 칩 disabled를 확인했다.
- Read UI: 방 카드와 방 정보는 서버 태그를 그대로 표시해 선택 제한의 영향을 받지 않는다.

## Verification

- Tag-limit targeted: 2 files, 9 tests pass
- `npm run test`: 15 files, 47 tests pass
- `npm run lint`: pass
- `git diff --check`: pass
- `npm run build`: pass
- Independent QA reviewer: `pass`

## Residual Risk

- 업로드 중 모달을 닫으면 요청을 취소하지 않는다. 성공한 임시 업로드는 방에 사용되지 않으면 서버 TTL까지 남을 수 있다.
- 제공된 임시 업로드 명세가 만료와 미사용 업로드 제한을 전제로 하며 취소 endpoint는 제공하지 않으므로 현재 범위에서는 허용한다.
- 기존 서버 데이터가 태그 4~5개인 방은 편집 UI에서 첫 3개만 보인다. 태그를 직접 변경하지 않은 PATCH에서는 `tags`를 생략해 초과 태그를 자동 삭제하지 않는다.
