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
