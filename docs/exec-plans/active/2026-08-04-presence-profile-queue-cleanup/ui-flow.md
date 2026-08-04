# UI Flow

## Follow Card

- `online && room`: 초록 점, `{room.title} 참여 중`, 우측 방 이동 화살표
- `online && !room`: 초록 점, `온라인`, 화살표 없음
- `!online`: 빨간 점, `오프라인`, stale room 값이 있어도 화살표 없음
- 상태 문구는 텍스트이고 방 이동 링크는 화살표에만 둔다.

## Music Power

- UP/DOWN은 기존 유효 대상에서만 클릭할 수 있고 클릭마다 PUT을 실행한다.
- 선택/pressed/cancel UI는 없으며 처리 중 중복 요청만 잠시 막는다.
- 안내: `동일한 사용자에게는 1시간에 한 번만 음악력을 평가할 수 있습니다.`

## Settings And Queue

- 대표 칭호 선택 첫 옵션은 `칭호 없음`이며 현재 값이 있을 때 선택하면 DELETE한다.
- 전체 트랙은 상위 playback의 current entry를 첫 위치에 합치고 중복 queue entry를 제거한다.
- current entry는 active 표현만 하며 drag/delete와 pending count에서 제외한다.

## Follow Card Actions

- 카드 본문 클릭: 해당 카드만 확장해 현재 관계를 반영한 `팔로우/언팔로우` 버튼과 `차단` 버튼을 표시한다.
- 방 이동 화살표 클릭: 카드 확장 상태를 바꾸지 않고 방으로 이동한다.
- 차단 탭 카드: presence 없이 아바타와 닉네임만 표시하고 우측 `차단 해제` 버튼을 제공한다.

## Story And Badge Award

- 사연은 컨테이너보다 긴 경우에만 같은 문장을 두 번 배치해 연속 순환하고 hover/focus에서 잠시 멈춘다.
- reduced motion 사용자는 사연 애니메이션과 confetti를 보지 않는다.
- badge modal은 새 칭호가 queue 선두가 될 때마다 한 번 confetti를 실행하고 기존 순차 닫기 동작을 유지한다.

## Track Title And Now Playing

- 현재 재생 신청자 카드와 queue 카드의 곡 제목은 컨테이너보다 긴 경우에만 기존 marquee로 연속 순환한다.
- 신청자 닉네임과 구분자는 고정하고 곡 제목 영역만 순환한다.
- 현재 재생 queue 항목의 썸네일은 `PLAY` 문자열 대신 세 막대 equalizer를 표시한다.
- equalizer 영역은 썸네일 전체를 `#ffffff` 60%로 덮고 막대는 `#3c3c3c`로 중앙 정렬한다.
- reduced motion 사용자는 제목을 직접 가로 스크롤할 수 있고 equalizer는 정적인 막대로 본다.
