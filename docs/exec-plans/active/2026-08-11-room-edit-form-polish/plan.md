# 방 편집·생성·참가자·채팅 후속 개선

## Scope

- 방 편집창을 생성 입력 규칙과 맞추고 기존 썸네일 교체와 최대 인원 편집을 지원한다.
- 참가자 관리 dropdown이 스크롤 영역에 잘리거나 스크롤 시 닫히는 문제를 해결한다.
- 방 생성 장르 단계는 태그 선택 전 `다음`을 비활성화한다.
- `FREE` 태그를 선택한 방이 `태그없음`으로 표시되지 않게 한다.
- 방 따라가기 버튼 시각 크기를 16×16으로 줄인다.
- 채팅 surface를 투명하게 하고 상단 fade/blur layer로 메시지 유입을 자연스럽게 만든다.

## Selected Skills

- `queuing-orchestrator`
- `queuing-feature-delivery`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership

- 생성/편집 modal UI: room create UI components
- 편집 draft와 submit orchestration: room update hook
- 썸네일 임시 업로드와 교체: room API + mutation hooks
- 참가자 menu open state: participant list/card; floating overlay shell: shared management menu
- FREE 표시: room tag presentation model/leaf UI
- 따라가기·채팅 시각 규칙: 해당 room UI CSS module

## Commit Slices

1. `feat(room): 방 편집 입력과 썸네일 교체 지원`
2. `fix(room): 생성 태그와 방 정보 표시 정정`
3. `fix(room): 참가자 관리 메뉴 clipping 방지`
4. `style(room): 따라가기와 채팅 레이어 조정`
5. `docs(delivery): 방 후속 개선 검증 기록`

## Acceptance Criteria

- 편집창에서 현재 썸네일을 확인하고 새 파일을 임시 업로드한 뒤 저장 시 교체 API를 호출한다.
- 일반 편집과 썸네일 편집은 각각 필요한 경우만 요청하고, 성공 후 room meta/list 관련 cache를 갱신한다.
- 편집 최대 인원 UI와 유효값은 생성의 필수 선택 옵션과 일치한다.
- 장르 단계에서 선택값이 0개면 `다음`이 disabled이고, 선택 즉시 활성화된다.
- FREE 태그가 있는 방은 `FREE`로 보이며 `태그없음` fallback으로 바뀌지 않는다.
- 참가자 dropdown은 participant scroll box에 clip되지 않고 메뉴 내부/목록 스크롤 때문에 의도치 않게 닫히지 않는다.
- 방 따라가기 시각 크기는 16×16이다.
- 채팅 배경은 투명하고 상단은 pointer를 막지 않는 fade/blur layer로 자연스럽게 흐려진다.
- targeted tests, lint, full test, build, fresh read-only QA가 통과한다.

## Progress

- [x] 요청·API 문서·아키텍처·스킬 확인
- [x] 현재 create/edit/menu/tag/chat 경계 조사
- [x] 구현과 targeted verification
- [x] lint/full test/build
- [x] fresh read-only QA
- [ ] explicit staging, commit, push, Draft PR 갱신

## Constraints

- 일반 room PATCH와 썸네일 PUT의 부분 성공 상태를 숨기지 않는다.
- 썸네일 교체 body는 `{ thumbnailUploadToken }`만 전송한다.
- 기존 비밀번호 유지 상태에 빈 password를 보내지 않는다.
- 실제 브라우저 시각 QA가 불가능하면 자동화/정적 근거와 잔여 위험을 분리해 기록한다.
