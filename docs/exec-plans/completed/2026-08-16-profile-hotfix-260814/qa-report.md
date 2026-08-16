# QA Report

## Result

- final classification: `pass`
- first review: `fix` — 차단 대상 A→B→A 전환 시 이전 사유 복원, 음악력 pending 연타 중복 요청 가능성 발견
- second review: `fix` — pending guard가 요청 순번을 먼저 증가시켜 기존 요청 오류 안내를 숨길 수 있는 race 발견
- final review: `pass` — `a43a8fe` 재검토 후 blocking finding 없음

## Boundary Checks

- 런타임과 CSS의 모바일 경계는 `480px`, desktop 경계는 `481px`로 일치한다.
- profile/follow presence는 optional 필드 누락을 offline으로 추정하지 않고 최초 실시간 이벤트도 적용한다.
- 선택 reason은 UI 로컬 상태가 소유하며 API 경계에서 trim한 빈 본문을 생략한다.
- `room.already-participating`은 target leave를 생략하고 timeout/abort의 불명확한 join 정리는 유지한다.
- STOMP `user.session-replaced`는 room socket/subscription/cache/chat만 정리하고 auth와 follow presence는 유지한다.
- 음악력 key/payload/cache는 사용자·방·재생 항목 단위이며 score event가 각 `myVote`를 보존한다.
- 이미 투표했거나 mutation pending인 클릭은 추가 요청을 만들지 않고, pending 재클릭도 기존 요청 오류 callback을 무효화하지 않는다.

## Verification

- targeted Vitest: 35 tests 통과
- `npm run lint`: 통과
- `npm run test`: 125 files, 467 tests 통과
- `npm run build`: 통과
- `git diff --check`: 통과
- 전체 테스트 첫 재실행에서 무관한 `RoomFormModal` 테스트가 5초 timeout으로 1회 실패했으나 단독 17/17 및 전체 재실행 467/467로 통과했다.

## Residual Risk

- 브라우저 인스턴스 부재로 지정 viewport의 실제 시각 렌더와 프로필 scrollbar를 확인하지 못했다.
- 실제 권한별 presence, 다중 브라우저 session replacement, broker deactivate 직후 다른 방 재입장은 통합 환경 수동 검증이 남는다.
