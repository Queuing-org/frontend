# QA Report

## 결과

- 판정: `pass`
- fresh read-only QA 1차: `fix`
  - infinite room list 전체 10초 polling이 랜덤 목록 재배치와 페이지 수만큼의 요청 증폭을 만들 수 있음을 확인
  - 음악력 안내가 신청자 변경 뒤 잠시 남을 수 있음을 확인
- 수정 후 재검토: `pass`

## 반영한 수정

- 랜덤 infinite 목록 polling을 제거하고 선택 방 `RoomMeta`만 10초마다 갱신한다.
- 최신 선택 방 메타를 홈/검색의 카드, 썸네일, 방 정보 및 입장 대상에 병합한다.
- 음악력 안내를 대상 slug에 귀속하고 이전 mutation 응답이 최신 안내를 덮지 않도록 순번을 검사한다.

## 검증

- 관련 테스트: 4 files / 31 tests pass
- `npm run lint`: pass
- `npm run test -- --reporter=dot`: 61 files / 166 tests pass
- `npm run build`: pass
- `git diff --check`: pass

## 참고

- 전체 테스트에 기존 `next/image` mock의 비표준 DOM attribute 경고가 있으나 실패는 없고 이번 변경과 무관하다.
- 내장 브라우저는 실행 환경 권한 메타 문제로 연결하지 못해 자동 클릭 smoke는 수행하지 못했다.
- 메타 polling은 현재 선택된 방에만 적용한다. 전체 랜덤 목록 polling은 UX와 요청량 회귀를 막기 위해 의도적으로 적용하지 않는다.
