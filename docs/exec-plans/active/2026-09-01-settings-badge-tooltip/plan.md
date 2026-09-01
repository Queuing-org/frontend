# 설정 칭호 획득 상세 툴팁

## Scope

- 설정 프로필의 네이티브 칭호 select를 접근성 있는 커스텀 리스트박스로 교체한다.
- 획득 칭호의 획득률과 획득 조건을 hover 또는 키보드 탐색 시 portal tooltip으로 표시한다.
- 내 칭호와 공개 칭호 GET 응답의 acquisitionRate를 같은 mapper에서 number 또는 null로 정규화한다.
- 기존 대표 칭호 설정/해제 mutation과 공개 프로필 UI는 유지한다.

## Acceptance Criteria

- 칭호 없음, 조회 로딩/오류, 저장 중 비활성화, 선택 즉시 저장 동작이 유지된다.
- ArrowUp/ArrowDown, Home/End, Enter/Space, Escape, 바깥 클릭을 지원하고 닫힌 뒤 trigger focus가 보존된다.
- 목록은 document.body portal에 렌더링되어 설정 modal overflow에 잘리지 않는다.
- 획득 칭호 hover/키보드 탐색 시 획득률과 획득 조건 두 문장이 표시되고 tooltip은 viewport 여백에 따라 좌우를 전환한다.
- 빈 설명과 잘못된 획득률에는 지정된 fallback 문구를 표시한다.
- acquisitionRate 숫자/숫자 문자열은 number로 정규화하고 비유한 값 또는 0~100 범위 밖 값은 null로 정규화한다.
- 방 및 친구 공개 프로필 UI와 모바일 전용 탭 동작은 변경하지 않는다.

## Selected Skills

- queuing-feature-delivery
- queuing-orchestrator
- queuing-api-boundary
- queuing-ui-flow
- frontend-architecture-guardrails
- queuing-qa-reviewer

## Commit Slices

1. `feat(settings): 칭호 획득 상세 선택기를 추가`
2. `docs(delivery): 칭호 상세 게시 상태를 기록`

## Progress

- [x] 현재 branch/worktree와 PR #58 확인
- [x] API/UI/state ownership 확인
- [x] acquisitionRate mapper 및 API 테스트
- [x] 커스텀 리스트박스, portal tooltip 및 UI 테스트
- [x] targeted/full local verification
- [x] fresh read-only QA
- [x] commit, push, Draft PR #58 갱신

## Verification

- targeted Vitest: badge API, ProfileSettingsTab
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`
- fresh read-only QA

결과:

- targeted Vitest: 2 files / 33 tests pass
- lint: pass
- full test: 152 files / 644 tests pass
- build: pass
- git diff --check: pass
- fresh QA: initial fix 1건 반영 후 pass

## Residual Risk

- 실제 로그인 데이터, 스크린리더, 브라우저 viewport에서 portal 배치·좌우 전환·긴 설명 wrapping은 수동 확인하지 않았다.
