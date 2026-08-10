# 방 내부 스크롤바 스타일 통일

## Scope

- 방 내부 채팅과 참가자 목록의 스크롤바 track을 투명하게 만든다.
- thumb를 얇고 연한 회색으로 통일하고 hover에서만 조금 진하게 만든다.
- WebKit/Chromium 계열 Windows 스크롤바의 화살표 버튼과 corner 배경을 제거한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Acceptance Criteria

- 채팅과 참가자 목록이 같은 scrollbar 스타일을 사용한다.
- Firefox는 `scrollbar-color/width`, Chromium/Safari는 WebKit pseudo-element로 대응한다.
- track/corner는 투명하고 scrollbar button은 크기 0으로 숨긴다.
- 기존 스크롤 동작과 목록 레이아웃이 유지된다.

## Commit

1. `style(room): 내부 목록 스크롤바 통일`

## Progress

- [x] 구현
- [x] targeted test, lint, full test, build, fresh QA (`pass`)
- [x] commit, push, Draft PR #42 갱신
