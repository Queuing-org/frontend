# Change Summary

## Product Flow

- 방 생성 모달에서 썸네일 파일을 선택하면 즉시 임시 업로드한다.
- 업로드 중/성공 상태와 서버 실패 메시지를 썸네일 입력 근처에 표시한다.
- 성공 token이 준비되기 전에는 다음 단계 이동을 막는다.
- 최종 방 생성 요청에 `thumbnailUploadToken`을 전달한다.
- 생성·수정 폼의 태그 선택을 공통 제약으로 최대 3개까지 허용한다.
- 3개 선택 시 카운터를 `3/3`으로 표시하고 미선택 태그 칩을 비활성화한다.

## Removed Flow

- 방 생성 완료 후 썸네일 PUT
- 썸네일 업로드 실패 시 생성된 방 DELETE 롤백

## Compatibility

- 썸네일을 선택하지 않는 방 생성 흐름 유지
- 기존 방 수정용 썸네일 PUT 흐름 유지
- 방 카드와 방 정보 등 조회 UI는 서버 태그를 임의로 자르지 않고 그대로 표시

## QA

- QA result: `pass`
- Targeted tag-limit tests: 9/9
- Full tests: 47/47
- Lint: pass
- Build: pass
