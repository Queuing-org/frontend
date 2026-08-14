# Request Summary

백엔드 hotfix `c91f8a` 배포를 기준으로 프론트엔드를 새 계약에 완전히 전환한다. deprecated endpoint, 온보딩 route/fallback, legacy cursor 및 queue request revision은 남기지 않는다. 공통 오류의 중첩 shape, 204 mutation, room/user-profile 경로, 실시간 room meta/deletion/chat deletion, 관계 캐시, 사용자 cursor 목록을 계약 테스트와 문서로 고정하고 Draft PR까지 전달한다.

명시적 비대상은 사용되지 않는 전체 queue replace client, `badge.representative-update-conflict` 전용 UI, 모든 폼의 field별 오류 UI 확장이다. badge SSE, thumbnail API, STOMP heartbeat, explicit leave는 유지한다.
