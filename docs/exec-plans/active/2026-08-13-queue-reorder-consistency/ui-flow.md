# UI Flow

## 연속 순서 변경

1. drag 중에는 정렬 transform을 표시하고, drag 종료 즉시 inline transform과 transition을 제거한다.
2. drop animation을 끄어 원본 행에 dnd-kit의 임시 `opacity: 0`이 남지 않게 한다.
3. drop 직후에는 로컬 optimistic order를 보이고 전체/내 신청곡 query cache에도 같은 순서를 적용한다.
4. API 응답 후 authoritative reset/refetch가 완료될 때까지 두 탭의 drag를 모두 잠그다.
5. 성공·실패 모두 동기화 완료 후 로컬 optimistic order를 제거하며, 실패는 snapshot과 서버 순서로 복구한다.

## 기존 제약

- 방장이 고정한 `ownerOrderLocked` 항목은 `내 신청곡`에서 계속 이동할 수 없다.
- 미로드 페이지가 있을 때 현재 로드 구간 끝 밖으로 이동하는 제약은 유지한다.
