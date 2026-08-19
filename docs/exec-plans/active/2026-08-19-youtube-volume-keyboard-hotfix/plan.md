# YouTube 볼륨 방향키 핫픽스

## 범위

- 영상 영역에 포인터가 들어오면 YouTube iframe에 포커스를 준다.
- YouTube 기본 키보드 제어를 명시적으로 활성화해 위·아래 방향키로 볼륨을 조절한다.
- 채팅 등 텍스트 입력 중에는 포커스를 빼앗지 않는다.
- 전역 방향키 핸들러나 별도 볼륨 상태는 추가하지 않는다.

## 전달 결정

- branch/base: `main`
- 사용자가 명시적으로 요청한 핫픽스이므로 일반 `dev` + Draft PR 흐름을 생략하고 `main`에 직접 커밋·push한다.
- commit slice: `fix(player): 영상 방향키 볼륨 조절을 위한 포커스 보강`
- selected_skills: `queuing-feature-delivery`, `queuing-ui-flow`, `frontend-architecture-guardrails`, `queuing-qa-reviewer`, `github:yeet`

## 수용 기준

- 영상 영역 hover 시 iframe이 포커스를 받는다.
- `disablekb`가 `0`이라 YouTube 기본 `ArrowUp`/`ArrowDown` 볼륨 제어가 유지된다.
- 텍스트 입력 중 영상 위로 포인터를 옮겨도 입력 포커스를 유지한다.
- 기존 autoplay·재생 상태 동기화 동작에 회귀가 없다.

## 검증

- [x] targeted player hook test — 1 file, 7 tests passed
- [x] `npm run lint` — passed
- [x] `npm run test` — 145 files, 563 tests passed
- [x] `npm run build` — passed
- [x] `git diff --check` — passed
- [x] diff 기반 QA review — pass

## 진행

- [x] 최신 원격 `main` fast-forward
- [x] 구현 및 회귀 테스트
- [x] 로컬 QA
- [ ] `main` 커밋·push 및 CI 확인

## 잔여 위험

- 실제 키 입력 처리는 YouTube iframe 기본 단축키에 의존한다. 브라우저나 YouTube 정책이 키보드 제어를 제한하면 별도 플레이어 API 기반 제어가 필요하다.
