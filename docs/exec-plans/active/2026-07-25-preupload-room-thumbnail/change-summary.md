# Change Summary

## Product Flow

- 방 생성 모달에서 썸네일 파일을 선택하면 즉시 임시 업로드한다.
- 업로드 중/성공 상태와 서버 실패 메시지를 썸네일 입력 근처에 표시한다.
- 성공 token이 준비되기 전에는 다음 단계 이동을 막는다.
- 최종 방 생성 요청에 `thumbnailUploadToken`을 전달한다.

## Removed Flow

- 방 생성 완료 후 썸네일 PUT
- 썸네일 업로드 실패 시 생성된 방 DELETE 롤백

## Compatibility

- 썸네일을 선택하지 않는 방 생성 흐름 유지
- 기존 방 수정용 썸네일 PUT 흐름 유지

## QA

- QA result: `pass`
- Targeted tests: 8/8
- Full tests: 44/44
- Lint: pass
- Compile/TypeScript: pass
- Full build: 기존 전역 `SsgoiProvider` prerender 오류로 실패, clean `origin/main`에서도 동일 재현
