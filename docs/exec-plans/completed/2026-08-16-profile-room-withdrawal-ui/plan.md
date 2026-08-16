# 프로필·방 관리·회원 탈퇴 UI 후속 개편

## Scope

- 친구 프로필 문구와 2줄 말줄임을 정비한다.
- 데스크톱 방 나가기 위치와 방장 승계 알림을 정비한다.
- 회원 탈퇴를 사유 선택과 지연 확인의 2단계 흐름으로 바꾼다.
- 방 수정 모달의 삭제 액션과 참여 제한/시간 제한 정렬을 정비한다.
- 신청 버튼과 모달의 `큐잉하기` 문구를 `노래신청`으로 통일한다.
- 신규 테스트 케이스는 추가하지 않고 깨지는 기존 테스트만 수정한다.
- 후속 사용자 승인에 따라 `dev` 커밋을 정리해 기존 Draft PR #49에 push한다.

## Selected Skills

- `queuing-orchestrator`
- `queuing-feature-delivery`
- `frontend-architecture-guardrails`
- `queuing-ui-flow`
- `queuing-api-boundary`
- `queuing-qa-reviewer`
- `queuing-pr-review-cycle`
- `github:gh-address-comments`
- `github:yeet`

## Ownership Decisions

- 탈퇴 단계, 선택 사유, 2초 타이머는 전용 withdrawal dialog 로컬 상태가 소유한다.
- 탈퇴 mutation과 로그아웃 후처리는 `AccountSettingsTab`이 유지한다.
- 방장 승계 알림은 `RoomPlaybackScreen`이 room-meta의 `false -> true` 전이를 관찰한다.
- 확인 모달은 기존 `RoomActionConfirmDialog`에 선택적 취소 버튼 prop만 추가해 재사용한다.
- API `WithdrawMeParams`와 WebSocket 이벤트 계약은 바꾸지 않는다.

## Commit Slices

1. `feat(ui): 친구 프로필과 방 상태 안내 정비`
2. `feat(settings): 회원 탈퇴 확인 흐름 개편`
3. `fix(room): 방 수정 액션과 참여 제한 정렬`
4. `docs(delivery): UI 후속 변경 검증 기록`

## Verification

- 관련 기존 테스트
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`
- 가능하면 데스크톱, compact, 480px 수동 UI 확인

## Progress

- [x] 요청과 브랜치/작업트리 확인
- [x] 구현 경계와 기존 테스트 확인
- [x] 친구 프로필·방 상태 안내 구현
- [x] 회원 탈퇴 흐름 구현
- [x] 방 수정 UI 구현
- [x] 전체 자동 검증 및 경계 리뷰
- [x] 로컬 커밋 4개 생성
- [x] 기존 Draft PR #49 갱신

## Residual Risk

- 사용자가 직접 시각 QA를 수행하므로 실제 픽셀 렌더링은 사용자 확인 대상으로 남겼다.
