# 루트 홈 경로 전환 계획

## 범위

- `/`에서 기존 홈 화면을 직접 렌더링한다.
- 기존 `/home` 주소는 `/`로 리다이렉트해 저장된 링크와 북마크를 호환한다.
- 앱 내부의 홈 이동 링크와 강퇴 후 이동 경로를 `/`로 통일한다.
- 홈 Open Graph canonical URL을 `/`로 맞춘다.

## 비범위

- 홈 화면 UI 및 서버 상태 로직 변경
- 인증 콜백의 사용자 지정 `next` 값 변경
- 기존 로컬 UI 변경 재작업

## 선택한 스킬

- `queuing-feature-delivery`: `dev` 브랜치와 기존 Draft PR 전달 흐름
- `queuing-ui-flow`: 홈/방/검색 내비게이션 경로 점검
- `frontend-architecture-guardrails`: App Router 파일은 주소 조립과 리다이렉트만 소유
- `queuing-qa-reviewer`: 실제 diff와 루트/호환 경로 검증

## 구현 순서

1. 기존 `/home` 페이지의 홈 조립과 metadata를 루트 페이지로 이동한다.
2. `/home` 페이지를 `/` 서버 리다이렉트로 변경한다.
3. 내부 홈 링크 및 programmatic navigation을 `/`로 통일한다.
4. 검색, 테스트, lint, test, build, HTTP smoke로 검증한다.
5. fresh read-only QA 후 명시적으로 관련 파일만 커밋·push한다.

## 인수 조건

- `/` 요청이 리다이렉트 없이 홈을 렌더링한다.
- `/home` 요청이 `/`로 리다이렉트된다.
- 로고, 검색 뒤로가기, 방 나가기, 강퇴 후 이동이 `/`를 사용한다.
- 코드 내 제품 경로로서 `/home` 참조가 호환 라우트 외에는 남지 않는다.
- `npm run lint`, `npm run test`, `npm run build`가 통과한다.

## 진행

- [x] 현재 라우트와 내비게이션 참조 조사
- [x] 구현
- [x] 로컬 검증
- [x] fresh QA
- [x] commit / push / PR 갱신

## 잔여 위험

- 외부에 저장된 `/home` 링크는 `308` 호환 리다이렉트에 의존한다.
