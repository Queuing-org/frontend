# 참가자 행 정렬 보정

## Scope

- 참가자 프로필 이미지의 왼쪽 끝을 헤더 `참가자`와 맞춘다.
- 참가자 관리 버튼의 오른쪽 끝을 헤더 인원 수와 맞춘다.
- 방장 왕관은 원본 비율을 유지하면서 닉네임 글자 높이에 맞춘다.
- 모달 크기와 상호작용 로직은 변경하지 않는다.

## Selected Skills

- `queuing-feature-delivery` (local-only delivery)
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Progress

- [x] 참가자 패널 DOM·반응형 CSS 확인
- [x] 행 좌우 정렬과 왕관 크기 수정
- [x] lint, build, diff 검증
- [x] fresh read-only QA
- [x] 로컬 커밋

## Verification

- `git diff --check`
- `npm run lint`
- `npm run build`
- 테스트 코드는 추가·수정·실행하지 않는다.

## Delivery

- branch: `dev`
- commit: `fix(room): 참가자 행 정렬 보정`
- push/PR: 하지 않음

## Result

- `git diff --check`: pass
- `npm run lint`: pass
- `npm run build`: pass
- fresh read-only QA: pass
- 테스트 코드 변경·실행: 없음
