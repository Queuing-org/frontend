# UI Flow

## Viewport density

1. `width <= 760px`는 기존 모바일 방 화면을 사용한다.
2. 데스크톱에서 `height <= 900px`이면 compact density를 사용한다.
3. CSS room layout과 JS floating geometry가 같은 경계에서 동시에 80% 비율로 전환된다.
4. density 전환 시 플로팅 패널 위치는 기존 clamp/scale 변환을 거쳐 화면 안에 유지된다.

## Chat fade

1. 메시지 목록 상단 104px 영역에서 흰색 오버레이가 투명해진다.
2. 96px에서 완전 투명해지고 마지막 8px는 투명 버퍼로 남는다.
3. compact에서는 전체 치수를 80%로 줄인다.
4. 관리 메뉴의 상위 레이어는 페이드보다 높은 z-index를 유지한다.
