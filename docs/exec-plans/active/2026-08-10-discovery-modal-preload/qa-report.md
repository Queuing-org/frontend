# QA Report

## Result

- status: pass
- scope: 홈·검색의 CREATE, FOLLOW, SETTING modal chunk preload와 open state

## Automated Verification

- `npm run lint`: pass
- `npm run test`: pass — 108 files, 330 tests
- `npm run build`: pass — 8 routes generated
- `git diff --check`: pass

## Boundary Checks

- CREATE, FOLLOW, SETTING은 정적 import로 합치지 않고 각각 production dynamic chunk로 유지된다.
- dynamic component fallback은 `null`이며 preload 성공 뒤에만 modal state를 연다.
- idle preload 실패는 사용자에게 노출하지 않고, 실제 클릭 실패는 `role="alert"` 영역에 표시한다.
- 실패 promise는 제거되어 같은 액션 재클릭 시 loader를 다시 실행한다.
- 단일 reservation으로 preload 중 교차 클릭과 열린 modal 위의 추가 요청을 차단한다.
- 홈·검색 desktop menu, mobile quick menu, 홈/검색 empty-state CREATE 버튼이 hover·focus·pointer intent를 전달한다.

## Production Bundle Evidence

- CREATE loader: runtime module `88140`, separate JS/CSS chunks
- FOLLOW loader: runtime module `96574`, separate JS/CSS chunks
- SETTING loader: runtime module `29203`, separate JS/CSS chunks
- 홈·검색 route chunk에는 위 loader 참조와 `loading: () => null`이 포함되며 modal 구현은 별도 chunk에서 로드된다.

## Manual QA Limitation

- Browser runtime에서 연결 가능한 browser instance가 없어 클릭 smoke test를 자동화하지 못했다.
- unit/state/UI interaction tests와 production bundle 검증으로 대체했으며, publish 전 fresh read-only QA를 별도로 수행한다.

## Fresh Read-only QA

- result: pass
- blocker: none
- 확인 범위: 세 modal open gate, 실패 재시도, 단일 reservation, desktop/mobile/empty-state intent, production chunk 분리, idle cleanup

## Remote Verification

- Draft PR: #39
- GitHub CI: pass
- Vercel: pass
- CodeRabbit: pass, inline/review comments 없음
