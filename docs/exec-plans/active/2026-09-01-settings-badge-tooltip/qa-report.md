# QA Report

## Result

- classification: pass
- blocking findings: none after one targeted fix

## Fresh Review Finding And Fix

- 최초 fresh review는 `hoveredIndex`가 키보드 이동보다 우선해 hover 중 ArrowDown 시 active option과 tooltip 내용이 달라지는 혼합 입력 버그를 발견해 `fix`로 판정했다.
- `moveActiveOption`이 hover 상태를 해제하도록 수정하고 `hover -> ArrowDown -> active descendant/tooltip 일치` 회귀 테스트를 추가했다.
- 후속 방어로 disabled 전환 시 portal을 즉시 숨기고 options 축소 시 active index를 유효 범위로 clamp했다.
- 수정 후 동일 reviewer의 최신 diff 재검토 결과는 `pass`다.

## Boundary Review

- 내 칭호와 공개 칭호 GET은 같은 mapper에서 acquisitionRate를 number 또는 null로 정규화한다.
- 공개 응답 metadata, query 조건, query key, stale time, 방/친구 profile presentation은 유지된다.
- 대표 칭호 설정/해제 mutation과 기존 cache invalidation은 변경하지 않았다.
- selector의 transient state는 설정 feature component 내부에만 있고 server 선택값은 query-derived value를 사용한다.
- listbox와 tooltip은 document.body portal 및 fixed positioning으로 modal overflow 경계를 벗어난다.
- select-only combobox, listbox/option, active descendant, described-by tooltip 관계와 요청된 키보드/바깥 닫기 동작을 테스트했다.
- pointer hover와 keyboard navigation에서만 tooltip을 노출하며 모바일 전용 tap-to-tooltip 상태는 추가하지 않았다.

## Verification

- targeted Vitest: 2 files / 33 tests passed
- `npm run lint`: passed
- `npm run test`: 152 files / 644 tests passed
- `npm run build`: passed, Next.js production TypeScript/build completed
- `git diff --check`: passed
- fresh read-only QA: pass after one fix cycle
- 추가 진단 `npx tsc --noEmit`: changed files와 무관한 기존 test typing 오류들로 실패; production build TypeScript gate는 통과

## Residual Risk

- 실제 로그인 브라우저와 스크린리더에서 portal 관계, viewport 좌우 전환, 긴 실제 설명의 wrapping은 수동 확인하지 않았다.
