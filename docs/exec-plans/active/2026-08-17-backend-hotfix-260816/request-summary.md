# Request Summary

Backend hotfix/260816을 배포된 유일한 계약으로 보고 deprecated fallback 없이 프론트엔드를 전환한다.

- 일반 방 전환은 이동 전 join을 보내고 `room.already-participating`에서 같은 연결·대상·비밀번호로 확인 join을 재전송한다.
- 충돌 취소는 모달을 띄운 화면에 머무르지 않고 오류의 기존 방 `data.slug`로 이동한다.
- 방 생성 conflict와 랜덤 후보 없음은 서버 메시지를 우선하며 각 모달/입력 또는 탐색 화면 상태를 보존한다.
- 랜덤 endpoint는 `GET /api/v1/rooms/random`, 응답은 `result.slug`만 사용한다.
- 명시적 leave 성공 뒤 홈 이동은 500ms 지연한다.
- 대기열 상태는 `ownerOrdered`로 교체하되 개인 재정렬 잠금에는 사용하지 않는다.
- PR #50 리뷰 3건은 코드·테스트로 수정하고 GitHub 답변/resolve는 하지 않는다.

PR #50은 요청 스냅샷과 달리 실행 시작 전에 이미 merge된 상태였다. 코드 구현은 `dev`에서 진행하되 기존 PR의 역사적 범위를 임의로 바꾸지 않는다.
