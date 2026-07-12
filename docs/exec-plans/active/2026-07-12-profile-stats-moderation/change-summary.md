# Change Summary

- 기능 단위 한국어 Conventional Commit 정책과 PR 검증 계약을 추가했다.
- Vitest/jsdom/Testing Library를 구성하고 CI에 test 단계를 추가했다.
- 프로필 통계와 음악력 조회/추천 및 캐시 동기화를 구현했다.
- 사용자 차단과 채팅 신고 API, 접근 가능한 모달, 오류/pending 경계를 구현했다.
- `ChatArea`에 작성자/식별자 조건별 관리 메뉴를 연결해 모바일과 데스크톱에 공통 적용했다.
- 독립 QA의 음악력 조회 실패 경계 지적을 수정한 뒤 lint/test/build와 재검토를 통과했다.
- PR 리뷰에서 발견된 포커스, 비로그인 액션, 메뉴 clipping, accessible name, deprecated CSS, 테스트 누락을 보완했다.
- 차단한 사용자의 채팅을 즉시/새로고침 후 모두 숨기고, 이용 시간 UI와 음악력 액션 위치를 후속 요구에 맞췄다.
