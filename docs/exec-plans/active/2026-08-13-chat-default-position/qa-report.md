# QA Report

## 판정

- 결과: `pass`
- blocking finding: 없음

## 배치 검증

- 1920×1080: 채팅 상단 673px, 참가자 하단과 193px 간격, 신청곡 패널 중앙 672.5px 기준
- 1536×864 compact: 채팅 상단 538px, 참가자 하단과 154px 간격, 신청곡 패널 중앙 538px 기준
- 1920×800 wide-short: 채팅 상단 499.2px, 참가자 하단과 19.2px 간격 보장
- 세 viewport 모두 채팅과 참가자 패널의 우측 edge가 일치한다.
- 저장된 drag offset은 새 기본값보다 우선하고, reset과 손상된 저장값은 새 기본값을 사용한다.
- 같은 density의 미드래그 기본 위치는 resize 때 다시 계산하고, density 전환은 모드별 저장값 또는 기본값을 복원한다.
- 모바일은 기존 floating 패널 미사용 경로와 `{ x: 0, y: 0 }` offset을 유지한다.

## 검증 명령

- `npm run test -- --run src/features/room/floating/model/useFloatingWidgetsState.test.ts` — 1 file / 16 tests passed
- `npm run lint` — passed
- `npm run test -- --run src/features/room/queue/ui/RoomQueueVirtualization.test.tsx` — 1 file / 4 tests passed
- `npm run test` — 118 files / 406 tests passed
- `npm run build` — passed
- `git diff --check` — passed

최초 full test와 build 병렬 실행 중 queue virtualization timeout 1건이 발생했다. 같은 파일 targeted 4개와 full suite를 순차 재실행해 모두 통과했다.

## DevTools 후속 확인

- 최초 구현은 화면상 위치만 맞고 DOM base style은 `left: 50%; bottom: 140px`로 남아 있었다.
- 후속 수정에서 채팅 placement style을 새 기본 위치의 `right`/`top`으로 직접 변경했다.
- 기본 drag offset은 `{ x: 0, y: 0 }`이며 transform은 사용자가 실제 드래그한 이동량만 담당한다.
- 기존 중앙 anchor 기준 localStorage 좌표는 v2 key로 변환해 기존 화면상 위치를 유지한다.

후속 fresh read-only QA에서 실제 outer DOM의 normal/compact/wide-short `right`/`top`, `{ x: 0, y: 0 }` 기본 offset, 새 base 기준 bounds, legacy 좌표 migration, 모바일·다른 위젯 불변을 확인했고 blocking finding 없이 `pass` 판정을 받았다.

## 잔여 위험

- 연결 가능한 브라우저 인스턴스가 없어 실제 화면에서 최초 배치와 drag를 시각 확인하지 못했다.
- invalid storage, custom offset의 same-density resize, mobile offset은 기존 분기를 유지하지만 전용 회귀 테스트는 없다.
- compact legacy migration은 normal과 동일 공식이며 수기 좌표로 최대 0.2px 반올림 오차만 확인했지만 독립 자동 테스트는 없다.
