# Review Findings

## Actionable

- [x] 사용자 후속 요구: 재생목록 URL을 입력했을 때 자동으로 여러 곡을 넣지 말고, `현재 영상만 추가`와 `재생목록 노래도 함께 추가` 중 하나를 사용자가 명시적으로 선택해야 한다.
- [x] 순수 `/playlist?list=...` URL은 현재 영상 ID가 없으므로 단일 영상 선택을 제공할 수 없다. 재생목록 노래 추가 선택을 명시적으로 요구하고 이 제약을 UI에 안내한다.

## Resolved

- PR #60 이전 head의 GitHub CI, Vercel, CodeRabbit check는 모두 통과했다.
- 기존 GitHub 리뷰와 인라인 요청 사항은 없다.
- URL 변경 시 이전 범위 선택을 초기화하고, 선택 전 제출을 차단하는 테스트를 추가했다.
- 후속 targeted/full test, lint, build, diff-check와 structured QA가 통과했다.

## Conflict

- 없음.
