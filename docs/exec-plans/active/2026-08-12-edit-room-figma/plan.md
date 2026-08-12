# 방 수정 모달 피그마 반영

## Scope

- 방 수정 모달을 제공된 Detail/편집 피그마의 세로형 패널 구조와 시각 체계로 재구성한다.
- `EDIT` pill, 중앙 썸네일, filled 제목 input, genre chip, 가로 설정 행, 하단 검정 완료 버튼을 반영한다.
- 피그마에 없는 썸네일 업로드 상태, 최대 인원, 방 삭제, 오류 피드백은 같은 디자인 체계 안에 보존한다.
- 참여 제한은 생성 화면처럼 `누구나 참여 / 비밀번호 입력` 메뉴와 복합 input으로 제공한다.
- 기존 room update/thumbnail/delete API와 cache 동작은 변경하지 않는다.
- 후속 요청으로 수정 modal 기본 폭을 664px로 조정하고 곡당 제한 시간·최대 인원·참여 제한의 행 구성을 재배치한다.
- 수정 API payload에 기존 room meta의 `trackLimitMinutes` 변경분을 연결한다.
- 채팅 빈 상태를 영역 세로 중앙에 배치하고, 최초 join 직후 stale room meta의 0명 표시를 즉시 보정한다.
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

- [x] 후속 요청의 edit payload, join cache, empty layout 경계 확인
- [x] 후속 UI·상태 구현
- [x] 후속 lint, build, diff 검증
- [x] 후속 fresh read-only QA
- [x] 후속 로컬 커밋

### Initial delivery

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
- follow-up commit: `fix(room): 방 수정 설정과 최초 입장 상태 보완`
- push/PR: 하지 않음

## Follow-up decisions

- 곡당 제한 시간은 생성과 동일한 고정 옵션을 공유하고 `PATCH /api/v1/rooms/{slug}`에 변경된 경우만 `trackLimitMinutes`를 보낸다.
- join 성공 시 캐시된 활성 인원은 최소 1명으로 즉시 보정하고 room meta를 백그라운드 재조회한다.
- 사용자 소유 chat blur 수치와 participant padding/왕관 크기 변경은 후속 커밋에서 제외한다.

## Result

- `git diff --check`: pass
- `npm run lint`: pass
- `npm run build`: pass
- fresh read-only QA: 동일 password mode 재선택과 dropdown placement 보완 후 pass
- browser QA: 연결 가능한 browser instance가 없어 수행하지 못함
- 테스트 코드 변경·실행: 없음

### Follow-up result

- `git diff --check`: pass
- `npm run lint`: pass
- `npm run build`: pass
- fresh read-only QA: pass
- 테스트 코드 변경·실행: 없음
- 공개 OpenAPI 경로는 production에서 404여서, `trackLimitMinutes` 수정 지원은 room meta/create 계약과 최신 사용자 요구를 기준으로 연결함
