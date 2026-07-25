# Review Findings

## PR State Before Follow-up

- PR: https://github.com/Queuing-org/frontend/pull/27
- Head: `feat/preupload-room-thumbnail` at `701a69f`
- GitHub Actions `Lint, test, and build`: pass
- CodeRabbit: pass
- Vercel: pass
- Unresolved review threads: none

## User Follow-up

### Actionable

1. 방 태그 선택 최대 개수를 5개에서 3개로 변경한다.
2. 생성 폼의 선택 방어, 미선택 칩 disabled 상태, 카운터, 생성 payload가 동일한 제한을 사용하게 한다.
3. 수정 폼의 초기값 정규화, 선택 방어, 미선택 칩 disabled 상태, 카운터, 저장 비교 상태가 동일한 제한을 사용하게 한다.
4. 생성과 수정에 중복된 상수를 하나의 room domain 제약으로 통합해 다시 어긋나지 않게 한다.

### Intentionally Unchanged

- 방 카드, 방 내부 정보 등 조회 UI는 서버가 반환한 태그를 그대로 표시한다. 선택 폼 제한을 이유로 기존 방의 표시 데이터를 임의로 숨기지 않는다.
- API payload 타입은 `tags?: string[]`를 유지한다. 프론트 폼이 최대 3개를 보장하고 최종 검증 책임은 서버에도 있다.

## Classification

- User request: `actionable`
- CI failures: none
- Review threads: none
- Conflicts or questions: none

## After Follow-up Push

- Head feature commit: `e6fbe61`
- GitHub Actions `Lint, test, and build`: pass
- CodeRabbit: pass
- Vercel: pass
- Unresolved review threads: none
- Independent QA: `pass`
