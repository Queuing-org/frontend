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

## Verification

- Targeted: 2 files, 8 tests pass
- `npm run test`: 14 files, 44 tests pass
- `npm run lint`: pass
- `git diff --check`: pass
- `npx next build --webpack`: compile 및 TypeScript pass
- Production prerender: 기존 `/_global-error`의 `useSsgoi must be used within SsgoiProvider` 오류로 실패
- Base comparison: clean `origin/main` archive에서도 동일 webpack prerender 오류 재현
- `npm run build`: Turbopack optimized production build 단계에서 13분 이상 무응답이라 중단

## Residual Risk

- 업로드 중 모달을 닫으면 요청을 취소하지 않는다. 성공한 임시 업로드는 방에 사용되지 않으면 서버 TTL까지 남을 수 있다.
- 제공된 임시 업로드 명세가 만료와 미사용 업로드 제한을 전제로 하며 취소 endpoint는 제공하지 않으므로 현재 범위에서는 허용한다.
- `npm run build` 성공 증거는 저장소의 기존 전역 prerender 문제 해결 전까지 확보할 수 없다.
