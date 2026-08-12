# QA Report

## Result

- status: pass
- 현재 곡 marquee는 방장에게만 SKIP 예약 폭을 적용하고 비방장은 남는 가로 폭 전체를 사용한다.
- 참가자 floating modal 크기는 유지하고 내부 목록·카드의 좌우 여백만 줄였다.
- 메시지 단위 blur state, viewport 측정, RAF, ResizeObserver 경로를 제거했다.
- 채팅 상단 strong/soft 두 고정 영역이 해당 영역 안의 내용을 통째로 blur한다.
- scroll 이벤트는 기존 scroll restoration만 처리하고 blur 렌더 상태를 변경하지 않는다.
- 흰색 background, gradient, mask는 사용하지 않는다.
- 모바일 padding과 avatar 직접 override를 blur 높이 계산 변수에도 반영했다.
- 열린 메시지 행은 blur 영역 아래에 남고 body portal의 관리 메뉴만 clipping 없이 표시된다.
- 테스트 파일은 추가하거나 수정하지 않았다.

## Verification

- `git diff --check`: pass
- `npm run lint`: pass
- `npm run build`: pass
- fresh read-only QA: pass after open-row stacking and mobile variable fixes

## Residual Risk

- backdrop blur 강도와 두 영역 경계의 최종 체감은 실제 브라우저에서 사용자가 육안 확인한다.
