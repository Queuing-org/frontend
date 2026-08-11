# 현재 곡 너비·참가자 여백·채팅 가시 블러 개선

## Scope

- 방장에게만 노출되는 `SKIP` 영역을 제외한 현재 곡 정보의 가로 공간을 모두 사용한다.
- 참가자 모달 크기는 유지하고 목록과 카드의 좌우 여백만 줄인다.
- 채팅 상단의 고정 blur overlay를 제거하고 실제 viewport에 보이는 첫째·둘째 메시지에 서로 다른 blur를 적용한다.
- 테스트 코드는 추가하거나 수정하지 않고 `dev`에 로컬 커밋까지만 만든다.

## Acceptance Criteria

- 방장은 `SKIP` 버튼과 겹치지 않는 범위, 비방장은 카드 끝까지 현재 곡 marquee 영역을 사용한다.
- 참가자 모달 외곽 크기와 메뉴 동작은 변하지 않는다.
- 채팅의 첫 번째 가시 메시지는 강한 blur, 두 번째는 약한 blur, 나머지는 선명하게 보인다.
- 스크롤, 창 크기 변경, 메시지 줄바꿈과 추가 시 가시 메시지를 다시 계산한다.
- 기존 fixed-height backdrop/mask blur 코드는 남지 않는다.

## Progress

- [x] 관련 컴포넌트와 반응형 CSS 구조 확인
- [x] 현재 곡 영역과 참가자 여백 조정
- [x] 실제 가시 메시지 기반 2단계 blur 구현
- [x] lint, build, diff 검증
- [x] fresh read-only QA
- [x] 로컬 커밋

## Verification

- `npm run lint`
- `npm run build`
- `git diff --check`
- 테스트 파일 변경 여부 확인
- desktop/mobile/compact DOM·CSS 경계와 스크롤 재계산 정적 검토

## Delivery

- branch: `dev`
- push: 하지 않음
- PR: 만들거나 수정하지 않음

## Result

- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- fresh read-only QA: empty chat 이후 observer 연결 보완 후 pass
- 테스트 코드 변경·추가: 없음
