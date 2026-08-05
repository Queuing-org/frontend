# 내 신청곡 프로필 상태 UI

## 범위

- 방 프로필 대상이 로그인 사용자 본인이면 음악력 평가 버튼을 숨긴다.
- 본인에게는 팔로잉/관리 액션과 같은 자리에 `내 노래가 나오고 있어요!` 상태 배너를 표시한다.
- 타인, 비로그인, 게스트 프로필의 기존 동작은 유지한다.
- 프로필 패널 크기와 정보 영역 배치는 변경하지 않는다.

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 상태 소유권

- 본인 여부: `RoomProfilePanel`의 공개 slug 비교 결과인 `isSelf`
- 상태 배너와 음악력 액션 가시성: `RoomProfilePanel` 렌더 분기
- 시각 스타일: `RoomProfilePanel.module.css`

## 커밋 계획

1. `feat(profile): 내 신청곡 프로필 상태 표시`

## 검증

- `RoomProfilePanel` 대상 테스트
- `npm run lint`
- `npm run test`
- `npm run build`
- fresh read-only QA
