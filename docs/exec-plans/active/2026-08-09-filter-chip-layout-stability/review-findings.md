# Review Findings

## Actionable

### 필터 칩 hover 시 줄바꿈 재배치

- 근거: `HomeControlPanelShell.module.css`의 기본 칩은 `--fw-bold`(700), hover는 `--fw-heavy`(900)를 사용한다.
- 영향: 클릭 직후 hover가 유지되면서 글자 폭과 칩 폭이 증가하고 flex-wrap 줄이 바뀐다.
- 수정: hover에서 font-weight 변경을 제거하고 배경색·글자색 피드백만 유지한다.

## PR 상태

- GitHub Actions: pass
- Vercel: pass
- 미해결 리뷰 스레드: 없음

