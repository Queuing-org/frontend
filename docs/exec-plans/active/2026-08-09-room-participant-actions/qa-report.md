# QA Report

## Result

- verdict: pass
- blocking findings: none

## Boundary Review

- 방장만 본인과 현재 방장을 제외한 식별 가능한 참가자의 `…` trigger를 사용할 수 있다.
- 회원은 팔로우/언팔로우, 신고, 차단, 내보내기, 방장 위임을 사용한다.
- 게스트는 `participantId` 기반 내보내기만 사용하고, 안전하게 식별할 수 없는 회원 전용 액션은 노출하지 않는다.
- 카드 본문은 `div`이고 hover/focus/touch에서 노출되는 별도 `…` button만 trigger라 거짓 카드 클릭 영역이 없다.
- 참가자 메뉴는 채팅이 사용하는 `RoomMemberManagementMenu`를 직접 재사용해 112px/38px, compact 89.6px/30.4px 규격을 공유한다.
- 동일 trigger 재클릭, 다른 참가자, 바깥 pointerdown, Escape 닫힘과 Escape focus 복원이 검증됐다.
- 목록 하단 공간이 부족하면 dropdown을 위로 연다.
- 방장 위임은 정규화·인코딩된 room slug와 trim한 `{ userSlug }`만 PATCH로 보낸다.
- 위임 성공은 권한 판정 원본인 room meta를 무효화하고 false 응답은 오류로 처리한다.
- 신고는 현재 불러온 회원 채팅 중 최신 `messageKey`만 기존 신고 modal에 연결한다.

## Verification

- targeted: 2 files, 8 tests passed
- full: 81 files, 246 tests passed (`--maxWorkers=1`)
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed
- fresh QA: pass

## Residual Risk

- 다른 접속자의 방장 상태 즉시 반영은 백엔드 WebSocket 방장 변경 이벤트 지원 여부에 의존한다. 현재 프론트에는 명시적인 owner-transfer event handler가 없다.
- 신고는 현재 로드된 회원 채팅의 `messageKey`만 사용할 수 있다.
- 높이가 극단적으로 작은 참가자 목록은 5행 메뉴가 위·아래 공간을 모두 초과해 일부 clip될 수 있다.
- 키보드 trigger는 접근 가능하지만 focus 표시는 채팅과 같은 연한 배경이라 대비가 강하지 않다.
- 로그인한 방장 세션을 사용한 실제 브라우저 시각 QA는 수행하지 못했다.
