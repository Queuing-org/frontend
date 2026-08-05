# 방 생성·음악력 피드백 및 방 목록 갱신

## 범위

- 썸네일 임시 업로드 성공 문구를 제거하고 진행 중 스피너와 오류만 표시한다.
- 방 프로필 음악력 버튼은 처리 중에도 다시 누를 수 있게 유지한다.
- 음악력 성공 클릭에는 안내를 표시하지 않고, 서버 오류일 때만 1시간 제한 안내를 2초 동안 표시한다.
- 비로그인 클릭은 mutation을 보내지 않고 로그인 필요 안내를 표시한다.
- 음악력 안내는 빨간색으로 화살표 아래 고정 영역에 표시해 프로필 UI를 밀지 않는다.
- 홈과 검색의 선택된 방 메타를 카드/썸네일에 합친다.
- 10초 polling은 서버 부하 때문에 제거한다.
- 방 목록과 선택 방 메타는 mount, 창 복귀, 네트워크 재연결 때 다시 조회한다.
- 방 생성·수정·삭제와 참가자 변경 mutation/event는 관련 목록·메타 캐시를 무효화한다.

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `queuing-api-boundary`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 상태 소유권

- 썸네일 업로드 진행/오류: 기존 React Query mutation 상태
- 음악력 오류/로그인 안내: `RoomProfilePanel` 로컬 상태와 정리 가능한 타이머
- 방 탐색 캐시: polling 없이 mount/focus/reconnect 재검증
- 방 목록: 기존 infinite query를 유지하고 선택 방에만 최신 메타를 병합

## 커밋 계획

1. `feat(room): 방 피드백과 목록 자동 갱신 개선`
2. `fix(room): 방 메타 polling 제거 및 캐시 재검증 보강`
3. `fix(profile): 음악력 오류 안내와 비로그인 처리 보강`

## 검증

- 관련 Vitest
- `npm run lint`
- `npm run test`
- `npm run build`
- fresh read-only QA
