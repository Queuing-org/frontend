# 방 수정 모달 피그마 반영

## Scope

- 방 수정 모달을 제공된 Detail/편집 피그마의 세로형 패널 구조와 시각 체계로 재구성한다.
- `EDIT` pill, 중앙 썸네일, filled 제목 input, genre chip, 가로 설정 행, 하단 검정 완료 버튼을 반영한다.
- 피그마에 없는 썸네일 업로드 상태, 최대 인원, 방 삭제, 오류 피드백은 같은 디자인 체계 안에 보존한다.
- 참여 제한은 생성 화면처럼 `누구나 참여 / 비밀번호 입력` 메뉴와 복합 input으로 제공한다.
- 기존 room update/thumbnail/delete API와 cache 동작은 변경하지 않는다.
- 사용자가 직접 수정 중인 chat blur와 participant CSS는 건드리거나 커밋하지 않는다.
- 테스트 코드는 추가·수정·실행하지 않고 `dev`에 로컬 커밋까지만 만든다.

## Selected Skills

- `queuing-feature-delivery` (local-only delivery)
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`
- `browser:control-in-app-browser` (가능한 경우 시각 QA)

## Progress

- [x] 피그마와 현재 modal/hook/API payload 경계 확인
- [x] interaction/state 설계 기록
- [x] modal 구조·스타일·참여 제한 UI 구현
- [x] lint, build, diff 검증
- [x] browser 시각 QA 시도 및 정적 시각 검토
- [x] fresh read-only QA
- [x] 로컬 커밋

## Verification

- `git diff --check`
- `npm run lint`
- `npm run build`
- 방 비밀번호 유지/새 비밀번호/해제 상태와 기존 payload builder 경계 정적 검토
- 테스트 파일 변경 여부 확인

## Delivery

- branch: `dev`
- commit: `feat(room): 방 수정 모달 디자인 개편`
- push/PR: 하지 않음

## Result

- `git diff --check`: pass
- `npm run lint`: pass
- `npm run build`: pass
- fresh read-only QA: 동일 password mode 재선택과 dropdown placement 보완 후 pass
- browser QA: 연결 가능한 browser instance가 없어 수행하지 못함
- 테스트 코드 변경·실행: 없음
