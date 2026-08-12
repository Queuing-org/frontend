# 방 상호작용 안정화

## 목표

- 참가자·채팅 dropdown, 채팅 하단 고정, 닉네임 줄바꿈을 수정한다.
- 방장/방 정보 WebSocket 이벤트를 room meta 캐시에 즉시 반영한다.
- 현재 곡·재생목록 marquee, YouTube 썸네일 fallback, 방 인원 표시를 정리한다.
- 팔로우 모달 차단 흐름, 중복 팔로우 안내, 검색 문구와 방 따라가기 크기를 수정한다.

## 결정

- 테스트 파일은 생성하거나 수정하지 않는다.
- `prefers-reduced-motion`은 계속 존중한다.
- 참가자 패널은 완료/상태 안내만 제거하고 실제 실패 안내는 유지한다.
- `dev`에 로컬 커밋만 남기며 push와 PR은 만들지 않는다.

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 커밋 순서

1. `fix(room): 실시간 방 상태와 참가자 정보를 동기화`
2. `fix(room): 채팅과 재생 정보 표시를 안정화`
3. `fix(follow): 친구 모달 상호작용을 정리`
4. `docs(delivery): 방 상호작용 안정화 결과 기록`

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] fresh QA review

## 결과

- `938e3e3 fix(room): 실시간 방 상태와 참가자 정보를 동기화`
- `bd3c068 fix(room): 채팅과 재생 정보 표시를 안정화`
- `f613bda fix(follow): 친구 모달 상호작용을 정리`
- push와 PR은 사용자 요청에 따라 생략했다.
