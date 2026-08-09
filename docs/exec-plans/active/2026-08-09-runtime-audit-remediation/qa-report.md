# QA Report

## 자동 검증

- `npm ci --ignore-scripts --no-audit --no-fund`: pass, 480 packages
- `npm run lint`: pass
- `npm run test`: pass, 103 files / 319 tests
- `npm run build`: pass, Next.js 16.1.1 production build and 8/8 static pages
- `git diff --check HEAD`: pass

## 고정한 회귀 조건

- room event burst에서 같은 query key refetch가 coalesce되는지
- stale in-flight GET이 취소된 뒤 최신 상태를 조회하는지
- 재연결 때 meta·playback·participants·queue가 검증되는지
- Strict Mode prejoin cleanup이 공유 meta GET을 취소하지 않는지
- 참가자 badge request가 화면에 보이는 카드로 제한되는지
- 채팅 상태와 DOM이 500개를 넘지 않는지
- hanging backfill의 8초 deadline, 후속 요청 재개, 동일 내용 request coverage가 유지되는지
- 참가자가 첫 cursor page만 요청되고 카드 DOM은 24개를 넘지 않는지
- 아직 로드하지 않은 참가자 관리 액션이 cursor를 single-flight로 탐색하고 미발견 mutation을 막는지
- queue idle DOM이 목록당 40개를 넘지 않되 drag 중에는 먼 drop target이 유지되는지
- 홈 stage가 최대 7개 카드만 렌더하는지
- 검색·모바일 room data/cache가 3페이지·90개를 넘지 않는지
- 참가자와 방 탐색 API가 이미 사용한 cursor를 반복하면 추가 GET 없이 중단하는지
- 사용자 검색 debounce·최소 글자·AbortSignal이 유지되는지
- media query server/client 첫 snapshot이 동일한지
- 동적 modal loading 중 접근 가능한 dialog shell이 유지되는지

## 읽기 전용 교차 리뷰

- room realtime/cache, participant/chat/queue, discovery/social/build를 구현 담당이 아닌 에이전트가 교차 검토했다.
- 발견된 stale invalidation, Strict Mode signal, socket handoff, modal fallback, favicon MIME 문제는 통합 과정에서 수정했다.
- 최종 fresh read-only QA에서 채팅 deadline·요청 범위, 참가자/방 탐색 반복 cursor, queue drag window를 재검증했고 blocker 없음으로 PASS 판정했다.

## 잔여 위험

- 실제 모바일 hard-load CLS 계측은 이번 자동 테스트 범위 밖이다.
- 참가자 badge batch API 부재로 전체 명단을 끝까지 스크롤하면 사용자별 요청이 누적된다.
- 단건 팔로잉 관계 API 부재로 첫 관계 확인은 전체 팔로잉 cursor를 탐색할 수 있다. 5분 공유 캐시로 반복만 억제한다.
- 전역 SUIT 파일 전송량은 별도 성능 증거가 생기면 후속 개선한다.
