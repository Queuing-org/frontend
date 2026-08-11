# 프로필 액션 높이 및 YouTube autoplay 보강

## 상태

- ci-pending
- 브랜치: `dev`
- 전달 범위: 사용자 승인에 따라 기존 Draft PR #44의 `dev` head를 갱신한다. 새 PR은 만들지 않는다.

## 요청

- `내 노래가 나오고 있어요!` 대체 박스를 팔로우·관리 버튼과 동일한 세로 크기로 고정한다.
- 사이트 새로고침 뒤 YouTube iframe이 가능한 환경에서는 별도 재생 클릭 없이 재생을 시작하게 한다.

## 확인된 원인

- 프로필 전용 `.followButton`과 공용 `FollowToggleButton.module.css`의 `.button`이 같은 specificity라 공용 36px/compact 28.8px가 프로필 전용 28px/22.4px를 덮을 수 있다.
- 상태 박스만 `border-box`이고 팔로우·관리 버튼은 `content-box`여서 같은 `height` 선언에도 padding과 border가 버튼 외곽 높이를 키웠다. 고정 패널의 세로 flex 압축도 상태 박스를 줄일 수 있었다.
- 플레이어는 이미 `autoplay: 1`, `loadVideoById`, `playVideo`를 사용한다.
- cross-origin iframe의 autoplay 권한 위임을 명시적으로 보장하지 않으며, 최종 소리 있는 autoplay는 브라우저 정책과 사용자/도메인 media engagement에 의해 차단될 수 있다.

## 구현

- `.followButton.followButton`으로 프로필 슬롯의 normal 28px·compact 22.4px 높이와 폰트를 확실히 고정한다.
- 팔로우·관리 버튼을 `border-box`로 통일하고 상태 박스와 액션 행을 `flex-shrink: 0`으로 고정해 실제 외곽 높이를 일치시킨다.
- YouTube player `onReady`에서 생성된 iframe의 `allow` 토큰에 `autoplay`를 보존적으로 추가한 뒤 기존 desired playback을 적용한다.
- 기존 allow 토큰을 덮어쓰지 않는다.
- 음소거 autoplay fallback은 음악을 놓치게 하므로 추가하지 않는다.

## 수용 조건

- self 상태 박스, 팔로우 버튼, 관리 버튼이 normal 28px, compact 22.4px로 일치한다.
- iframe에 기존 permission token과 `autoplay`가 함께 남는다.
- ready 시 PLAYING desired state는 현재 video/time으로 `loadVideoById` 후 `playVideo`를 호출한다.
- PAUSED/ENDED 상태는 autoplay 보강 때문에 재생되지 않는다.
- 브라우저가 unmuted autoplay를 차단하는 경우를 성공으로 가장하지 않는다.

## 선택한 기술 경로

- `queuing-feature-delivery`: 로컬 QA와 커밋 범위를 관리한다.
- `queuing-orchestrator`: 프로필 CSS와 iframe lifecycle을 한 run에서 조정한다.
- `queuing-ui-flow`: 대체 액션 슬롯과 플레이어 상호작용을 보존한다.
- `frontend-architecture-guardrails`: autoplay 권한 처리를 player hook 내부에 유지한다.
- `queuing-qa-reviewer`: CSS cascade, player state, 브라우저 정책 경계를 fresh read-only로 검토한다.

## 진행

- [x] 프로필 CSS cascade와 player lifecycle 조사
- [x] 공식 YouTube/Chrome autoplay 정책 확인
- [x] 프로필 액션 높이 수정
- [x] iframe permission 및 ready playback 테스트
- [x] 프로필 최종 box model fresh read-only review — pass
- [x] 로컬 커밋
- [x] 기존 Draft PR #44의 `dev` head push
- [ ] 원격 CI 확인

## 예정 커밋

1. `76a7636 fix(profile): 대체 액션 높이 통일`
2. `b4c84df fix(player): iframe autoplay 권한 보강`
3. `2bbe1dc fix(profile): 프로필 액션 실제 높이 통일`
4. `docs(delivery): 프로필 액션과 autoplay 검증 기록`

## 검증

- `npm run test -- src/features/room/profile/ui/RoomProfilePanel.test.tsx src/features/playlist/player/hooks/useYouTubeIframePlayer.test.tsx` — 2 files / 33 tests pass
- `npm run lint` — pass
- `npm run build` — player 변경 포함 상태에서 pass
- 전체 테스트 첫 실행은 lint 병렬 자원 경합으로 13개 UI 테스트가 timeout, 해당 4 files / 31 tests 단독 재실행 pass
- 최종 box model 수정 뒤 RoomProfilePanel 27 tests와 lint pass
- 최종 build 재시도는 사용자 요청으로 중단했으며 추가 테스트 없이 PR CI에 위임
- fresh read-only CSS review — pass

## 잔여 위험

- Chrome/Safari/Firefox가 사용자 입력 없는 소리 있는 autoplay를 막으면 웹 코드만으로 강제할 수 없다.
- 연결 브라우저가 없으면 실제 refresh autoplay 허용/차단 경로는 unit test와 공식 정책 검토로 대체한다.
