# 방 생성·음악력 피드백 및 방 목록 갱신

## 범위

- 썸네일 임시 업로드 성공 문구를 제거하고 진행 중 스피너와 오류만 표시한다.
- 방 프로필 음악력 버튼은 처리 중에도 다시 누를 수 있게 유지한다.
- 음악력 평가 안내/오류는 버튼 왼쪽에서 2초 동안만 표시한다.
- 홈과 검색의 선택된 방 메타를 10초마다 다시 조회하고 카드/썸네일에 합친다.
- 랜덤 infinite 목록 전체는 poll하지 않아 목록 재배치와 페이지 수만큼의 요청 증폭을 막는다.

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `queuing-api-boundary`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 상태 소유권

- 썸네일 업로드 진행/오류: 기존 React Query mutation 상태
- 음악력 임시 안내: `RoomProfilePanel` 로컬 상태와 정리 가능한 타이머
- 선택 방 메타: `useRoomMetaQuery`의 `refetchInterval`
- 방 목록: 기존 infinite query를 유지하고 선택 방에만 최신 메타를 병합

## 커밋 계획

1. `feat(room): 방 피드백과 목록 자동 갱신 개선`

## 검증

- 관련 Vitest
- `npm run lint`
- `npm run test`
- `npm run build`
- fresh read-only QA
