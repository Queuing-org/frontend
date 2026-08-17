# 리뷰 확인 결과

## 후속 수정 전 PR 상태

- PR #52 head: `dev`의 `f22d11d`
- GitHub Actions `Lint, test, and build`: 통과
- Vercel: 통과
- GitHub 조회 결과 PR은 open/non-draft 상태다. 이번 후속 수정에서는 이 상태를 변경하지 않는다.

## 허용된 칭호 모달 교정

- classification: `actionable`
- 기존 세 줄 문구를 최신 두 문장 계약으로 교체한다.
- 데스크톱 모달을 496px에서 640px로 확장하고 높이 370px, padding 40px, radius 20px를 유지한다.
- 액션 크기와 pending 잠금은 유지하면서 검정 확인 버튼을 파란 글자 버튼으로 교체한다.

## 이번 run 범위 밖의 기존 unresolved thread

- `actionable / out-of-scope`: `useRoomRealtimeEvents.ts`에서 홈 이동이 끝날 때까지 방 access token 해제를 지연해야 한다.
- `actionable / out-of-scope`: `UpdateRoomButton.tsx`에서 현재 곡 이미지를 편집 가능한 방 썸네일 존재 신호로 사용하지 않아야 한다.
- `actionable / out-of-scope`: `RoomFormModal.tsx`에서 방 생성 직후 join 실패 시 생성 결과를 보존해야 한다.

세 건 모두 이번 시안 교정보다 먼저 생성된 room-domain finding이다. 이번 run에서는 코드를 수정하거나 thread를 resolve하지 않는다.
