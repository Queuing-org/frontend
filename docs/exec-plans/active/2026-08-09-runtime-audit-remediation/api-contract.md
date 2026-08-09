# API·캐시 계약

## 조회 취소

- TanStack Query의 `queryFn`이 받는 `AbortSignal`을 방 메타, 재생 상태, 참가자, 전체·내 큐, 채팅 기록, 사용자 검색, 공개 프로필, 음악력, 칭호 조회의 Axios 요청까지 전달한다.
- 방 입장 전 메타 조회는 route effect의 수명이 아니라 React Query가 소유하는 signal을 사용한다. React Strict Mode 재실행으로 공유 요청이 취소되지 않아야 한다.

## 방 읽기 캐시 동기화

- 같은 방의 mutation과 WebSocket 사건은 `room-read:{slug}` scope의 공용 invalidation scheduler를 사용한다.
- 75ms 안에 발생한 playback, participants, queue, meta invalidation을 합쳐 중복 refetch를 줄인다.
- 이미 진행 중인 GET은 먼저 취소한 뒤 invalidate한다. `cancelRefetch: false`로 오래된 응답을 흡수하지 않는다.
- 낙관적 queue 재정렬·삭제는 queue reset 의미를 유지하면서 playback invalidation과 합친다.
- 재연결 시 meta는 활성 여부와 관계없이 즉시 refetch하고 playback, participants, queue를 다시 검증한다.

## 요청량 상한

- 재생목록은 페이지당 30개를 조회하고 `내 신청곡` query는 해당 탭에서만 활성화한다.
- 참가자는 입장 시 첫 100명만 조회하고, 참가자 패널의 `더보기` 또는 아직 로드하지 않은 사용자의 관리 액션에서만 다음 cursor를 조회한다. 동시에 발생한 cursor 탐색은 single-flight로 합친다.
- 참가자 공개 칭호는 화면에 보이는 카드만 요청하며 5분 동안 캐시한다.
- 사용자 검색은 앞뒤 공백 제거, 최소 2자, 250ms debounce, 이전 요청 취소를 적용한다.
- 홈·검색 방 목록 infinite cache는 최대 3페이지를 유지하며 UI에 전달하는 방도 최대 90개로 제한한다.

## 서버 변경이 필요한 잔여 항목

- 참가자 칭호 batch endpoint가 없으므로 사용자가 250명을 끝까지 스크롤하면 결과적으로 사용자별 요청이 발생한다. 프론트에서는 visible-only와 cache까지만 적용했다.
- 관계 상태를 한 번에 내려주는 별도 endpoint가 없는 영역은 현재 공개 계약을 유지한다. 전체 팔로잉 결과를 5분 공유 캐시해 재오픈 반복 조회만 줄였으며, 존재하지 않는 호환 API는 만들지 않는다.
