# QA Report

## 결과

- 판정: `pass`
- fresh read-only QA 1차: `fix`
  - infinite room list 전체 10초 polling이 랜덤 목록 재배치와 페이지 수만큼의 요청 증폭을 만들 수 있음을 확인
  - 음악력 안내가 신청자 변경 뒤 잠시 남을 수 있음을 확인
- 수정 후 재검토: `pass`
- 10초 polling 제거 후 fresh read-only QA: `pass`

## 반영한 수정

- 방 목록과 선택 방 `RoomMeta`의 모든 시간 기반 polling을 제거한다.
- mount, 창 복귀, 네트워크 재연결 때만 방 탐색 캐시를 재검증한다.
- 방 삭제 성공 시 삭제된 방 메타를 제거하고 모든 방 목록을 무효화한다.
- 최신 선택 방 메타를 홈/검색의 카드, 썸네일, 방 정보 및 입장 대상에 병합한다.
- 음악력 안내를 대상 slug에 귀속하고 이전 mutation 응답이 최신 안내를 덮지 않도록 순번을 검사한다.
- 음악력 성공 클릭에서는 안내를 만들지 않고 mutation 오류 응답이 있을 때만 서버 메시지를 2초 표시한다.
- 비로그인 클릭은 mutation을 보내지 않고 로그인 필요 안내를 표시한다.
- 음악력 안내는 화살표 아래 절대 위치에 배치해 프로필 레이아웃을 밀지 않으며, 빨간색 `#c94343`으로 흰 배경 대비 약 `4.81:1`을 확보한다.

## 음악력 후속 QA

- fresh read-only QA 1차: `fix`
  - 기존 빨간색이 10px 일반 텍스트의 WCAG AA 명암 대비 기준에 미달함을 확인
- `#c94343`으로 수정 후 재검토: `pass`
- 성공 무안내, 오류 전용 안내, 비로그인 mutation 차단, 연속 요청 stale 오류 방지, 데스크톱/모바일 고정 배치를 확인했다.

## 검증

- polling 제거 관련 테스트: 2 files / 3 tests pass
- `npm run lint`: pass
- 음악력 프로필 대상 테스트: 1 file / 19 tests pass
- `npm run test -- --reporter=dot`: 62 files / 168 tests pass
- `npm run build`: pass
- `git diff --check`: pass

## 참고

- 전체 테스트에 기존 `next/image` mock의 비표준 DOM attribute 경고가 있으나 실패는 없고 이번 변경과 무관하다.
- 내장 브라우저는 실행 환경 권한 메타 문제로 연결하지 못해 자동 클릭 smoke는 수행하지 못했다.
- 활성 탭을 계속 열어둔 채 focus/reconnect/mutation이 없으면 자동 갱신하지 않는다. 서버 부하를 막기 위한 의도된 동작이다.
