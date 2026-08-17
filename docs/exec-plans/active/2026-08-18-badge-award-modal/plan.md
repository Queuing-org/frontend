# 칭호 획득 모달 개편

## 목표

- `badge-awarded` SSE의 nullable `description`을 보존하고 획득 조건 문구에 사용한다.
- 496×370 모달, 칭호 라벨, 제목·설명·두 액션을 요청한 시안대로 구성한다.
- `적용하기`는 새 칭호를 대표 칭호로 설정하고 `확인`은 다음 칭호로 넘어간다.
- 기존 폭죽 효과와 여러 칭호의 순차 표시를 유지한다.

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 구현 순서

1. `feat(badge): 칭호 획득 모달과 대표 칭호 적용 개선`
2. `docs(delivery): 칭호 획득 모달 검증 기록`

## 수용 기준

- SSE payload의 `description: string | null`을 안전하게 파싱한다.
- 칭호 이름 라벨, `새로운 칭호 획득`, 달성 설명을 지정된 크기·색상·타이포로 표시한다.
- 적용 성공 시 관련 내 칭호·프로필 캐시를 갱신하고 모달을 닫으며, 실패 시 현재 모달을 유지한다.
- 확인·Escape·배경 클릭은 mutation 진행 중이 아닐 때 현재 칭호만 닫는다.
- 모바일에서는 화면 폭에 맞게 축소하고 콘텐츠나 버튼이 잘리지 않는다.

## 검증

- badge event parser/provider/modal targeted Vitest
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`
- fresh read-only QA

## 진행

- [x] SSE 계약과 현재 모달·대표 칭호 mutation 확인
- [x] 모델·UI·적용 동작 구현
- [x] targeted/full QA
- [x] fresh QA 지적 사항 수정
- [x] 커밋·push·Draft PR 전달
