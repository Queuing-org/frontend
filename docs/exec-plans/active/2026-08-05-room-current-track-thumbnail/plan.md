# 방 현재 곡 썸네일과 단일 기본 이미지

## 범위

- 기존 기본 방 썸네일 10장을 삭제한다.
- `/Users/aryu/Downloads/Basic_Profile (Light.ver).jpg`를 단일 빈 방 fallback 이미지로 복사한다.
- 서버가 내려주는 `RoomMeta.thumbnailUrl(s)`를 현재 곡 썸네일로 우선 표시한다.
- 현재 곡 썸네일이 없을 때만 단일 fallback을 표시한다.
- `TRACK_STARTED`와 마지막 곡의 `TRACK_ENDED`에서 방 메타를 즉시 무효화한다.

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 상태 소유권

- 현재 곡 썸네일: `RoomMeta` React Query 캐시
- 곡 전환 감지: 방 STOMP `TRACK_STARTED`/`TRACK_ENDED`
- 빈 방 fallback: `getRoomImageSrc`의 단일 정적 이미지

## 커밋 계획

1. `feat(room): 현재 곡 썸네일과 빈 방 기본 이미지 적용`

## 검증

- 이미지 파일/참조 검사
- 기본 이미지 우선순위 및 WebSocket 캐시 무효화 테스트
- `npm run lint`
- `npm run test`
- `npm run build`
- fresh read-only QA
