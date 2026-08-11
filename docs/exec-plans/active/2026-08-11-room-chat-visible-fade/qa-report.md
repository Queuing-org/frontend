# QA Report

## Result

- status: pass
- 현재 곡 marquee는 방장에게만 SKIP 예약 폭을 적용하고 비방장은 남는 가로 폭 전체를 사용한다.
- 참가자 floating modal 크기는 유지하고 내부 목록·카드의 좌우 여백만 줄였다.
- 기존 고정 높이 backdrop/mask blur와 관련 CSS 변수를 제거했다.
- 실제 채팅 viewport와 교차하는 첫째·둘째 메시지를 strong/soft로 구분한다.
- scroll, window resize, message list resize, empty/list mount 전환, 상단 상태 문구 변화 시 위치를 다시 계산한다.
- RAF 중복 방지와 key 동일성 비교로 불필요한 state update를 제한한다.
- 테스트 파일은 추가하거나 수정하지 않았다.

## Verification

- `git diff --check`: pass
- `npm run lint`: pass
- `npm run build`: pass
- fresh read-only QA: pass after one bounded observer lifecycle fix

## Residual Risk

- blur 강도와 참가자 여백의 최종 체감은 실제 브라우저에서 사용자가 육안 확인한다.
