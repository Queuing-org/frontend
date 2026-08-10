# 방 관리 UI 수정

## Scope

- 참가자 가상 목록의 관리 드롭다운이 다른 행 뒤로 들어가거나 잘리지 않게 한다.
- 방 수정 모달의 방 사진 필드는 backend 수정 범위가 필요해 이번 전달에서 제외한다.
- 채팅 전송 확인 timeout은 내부 pending 정리만 수행하고 사용자 오류 문구로 노출하지 않는다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-ui-flow`
- `queuing-api-boundary`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership

- 참가자 메뉴 stacking/overflow: `RoomParticipantList`와 참가자 CSS module
- 채팅 confirmation lifecycle: `useRoomChatRealtime`
- 방 수정 폼 상태: `useEditRoomForm`
- 방 사진 저장 계약: backend 지원 여부 확인 후 API client와 mutation hook

## Acceptance Criteria

- 열린 참가자 메뉴가 인접 행보다 위에 표시되고 목록 경계 안에서 위/아래 배치된다.
- 채팅 confirmation timeout 뒤 pending 상태와 타이머는 정리되지만 지연 오류 문구는 비어 있다.
- backend 계약 없이 저장되지 않는 방 사진 필드를 노출하지 않는다.
- targeted test, lint, full test, build가 통과한다.

## Contract Finding

- 2026-08-10 기준 backend `main`의 `UpdateRoomRequest`에는 사진 필드가 없고, `RoomThumbnailV2Controller`는 생성 전 임시 업로드 POST만 제공한다.
- 프론트 전용으로 저장되지 않는 필드를 만들지 않는다. backend 변경 권한 확인 전 사진 저장 구현은 blocked 상태다.

## Commit Slices

1. `fix(room): 참가자 메뉴와 채팅 지연 피드백 정리`

## Progress

- [x] 관련 UI와 최신 backend 계약 확인
- [x] 참가자 드롭다운 stacking 수정과 테스트
- [x] 채팅 지연 문구 제거와 테스트
- [x] 방 사진 수정 제외 결정 (사용자가 backend 변경을 진행하지 않기로 함)
- [x] targeted test, lint, build
- [x] full test, fresh QA (`pass`)
- [x] commit, push, Draft PR #42

## Residual Risk

- 방 사진 수정은 backend 계약 없이 프론트만 먼저 배포할 수 없어 미반영 상태다.
