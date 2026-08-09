# 필터 칩 레이아웃 안정화

## 상태

- 단계: ready
- 브랜치: `dev`
- 전달 대상: Draft PR #36

## 문제

- 필터 칩을 클릭하면 포인터 hover가 유지되는 동안 글자 굵기가 700에서 900으로 바뀐다.
- 가변 폰트의 글자 폭 증가로 flex-wrap이 재계산되어 칩 크기와 줄바꿈이 흔들린다.

## 수용 조건

- hover, 선택, 선택 해제 전후 칩의 타이포 geometry가 변하지 않는다.
- 배경색·글자색 피드백은 유지한다.
- 홈과 검색에서 공유하는 `HomeControlPanelShell` 한 곳만 수정한다.
- 관련 테스트, lint, build, fresh read-only QA와 원격 CI를 통과한다.

## 진행

- [x] 원인 및 PR 상태 확인
- [x] CSS 수정
- [x] 로컬 검증
- [x] push 및 원격 CI 확인
