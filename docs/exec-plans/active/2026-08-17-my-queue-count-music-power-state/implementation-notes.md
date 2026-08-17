# Implementation Notes

## 내 신청곡 수

- 기본 `all` 탭에서도 로그인 사용자의 `useMyRoomQueue`를 활성화했다.
- 탭 count는 개인 queue 첫 페이지의 `totalPendingCount`를 사용한다. 전체 queue 페이지를 사용자 기준으로 다시 세지 않아 pagination에 영향을 받지 않는다.
- 인증 확인 중이거나 로그인 사용자의 개인 queue 데이터가 없는 동안은 count를 `null`로 유지하고 UI에서 `…`로 표현한다.

## 음악력 버튼

- 서버 `myVote`를 우선하고, mutation pending 상태에서는 같은 방·재생 entry·대상 사용자의 요청만 임시 선택 상태로 표시한다.
- 현재 선택은 `aria-pressed`로 표현해 hover/focus와 같은 진한 배경을 유지한다.
- 이미 평가했거나 요청 중이라는 이유로 버튼을 disabled 처리하지 않았다. 기존 안내와 중복 요청 guard가 계속 담당한다.
- query key가 현재 entry에 묶여 있으므로 재생 entry 변경 시 이전 선택 상태가 남지 않는다.
