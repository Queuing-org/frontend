# UI 흐름과 렌더 상한

## 방

- 채팅은 최근 500개만 상태와 DOM에 유지한다. 과거 기록은 single-flight scheduler로 한 페이지씩 불러오고 prepend 전후 scroll height 차이만큼 보정한다.
- 참가자 목록은 24개 카드만 mount하는 고정 row virtual window를 사용한다. 전체 수는 로드한 배열 길이가 아니라 room meta를 표시하고, 칭호 query는 그중 실제 가시 카드만 활성화한다.
- 긴 텍스트 marquee는 hover 또는 focus 상태에서만 움직이며 모든 인스턴스가 하나의 `ResizeObserver`를 공유한다.
- 큐는 처음 30개만 조회하고 사용자의 `더 보기` 동작에서 다음 구간을 붙인다. 일반·sortable 각 목록은 평상시 최대 40개 카드만 mount하고, 실제 drag 중에만 먼 drop target 보존을 위해 sortable 구간 전체를 임시 mount한다.

## 홈·검색·소셜

- 홈 stage는 선택 방을 기준으로 최대 7개 카드만 DOM에 유지한다. 양옆 카드 클릭으로 전체 목록 index가 정상 이동한다.
- 검색·모바일 목록은 최대 3페이지·90개 방의 sliding window만 보관하고 렌더한다. focus/reconnect 재검증도 저장된 세 페이지만 대상으로 한다.
- 홈과 검색의 무거운 modal body는 필요할 때만 동적 로드한다. 청크를 기다리는 동안 접근 가능한 dialog shell과 focus target은 유지한다.
- 모바일 검색 입력의 transient state는 상단 바 owner가 관리하며 데스크톱 stage state와 분리한다.
- media query server snapshot은 항상 데스크톱과 동일한 초기값을 반환해 hydration mismatch를 막는다.

## 잔여 위험

- 모바일 hard-load에서는 hydration 오류는 없지만 데스크톱 tree가 첫 HTML에 포함되므로 hydration 뒤 짧은 레이아웃 교체 가능성은 남는다.
- RoomForm·Follow modal CSS 일부는 초기 CSS chunk에 남아 있다. JS 지연 로드는 적용됐으며 CSS 분리는 후속 번들 작업으로 남긴다.
- 참가자 칭호 batch와 단건 팔로잉 관계 API가 없어 최악의 경우에는 cursor 탐색·사용자별 요청이 남는다. 초기 화면에서는 실행하지 않고 명시적 가시성·액션에만 묶었다.
