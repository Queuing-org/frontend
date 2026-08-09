# QA Report

## 자동 검증

- `npm run test -- ...follow...`: 11 passed
- `npm run test`: 178 passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

## Fresh read-only review

- Result: pass
- 세 빈 상태가 공통 컴포넌트의 동일한 직접 배치 구조를 사용함.
- 탭 개수와 목록이 동일한 React Query key를 공유함.
- API에 전체 개수가 없어 첫 페이지 수와 `+` 표기를 사용하는 결정이 타당함.
- 팔로우 관련 mutation의 `followKeys.all()` 무효화 범위에 개수 캐시가 포함됨.
- 각 탭 아이콘 경로와 14×14px CSS mask를 확인함.

## 수동 브라우저 QA

인앱 브라우저 런타임에 연결 가능한 브라우저 인스턴스가 없어 실행하지 못했다. 정적 UI 구조, CSS 및 컴포넌트 테스트로 대체했으며 사용자 소유 검색창 폭 CSS는 변경 범위에서 제외했다.
