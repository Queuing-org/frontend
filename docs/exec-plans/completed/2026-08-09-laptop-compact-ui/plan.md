# 노트북 데스크톱 Compact UI

## 목표

- 브라우저 100% 확대 상태에서 1366×768~1600×900 노트북 화면이 별도 줌 조작 없이 현재 데스크톱 구도를 유지하도록 한다.
- compact 대상 고정 치수·글자·아이콘·간격을 현재 대비 80%로 축소한다.
- FHD 이상과 760px 이하 모바일 레이아웃은 그대로 유지한다.

## Viewport 계약

- mobile: `width <= 760`
- laptop compact: `761 <= width <= 1600 && height <= 900`
- normal desktop: 그 외 `width > 760`
- 전체 화면 배경 및 `vw`/`vh` 점유율은 유지하고 고정 geometry만 축소한다.
- 전역 `zoom` 또는 루트 `transform: scale()`은 사용하지 않는다.

## 구현 단위

1. `feat(viewport): 노트북 compact viewport 계약 추가`
   - 순수 viewport 판별 함수와 경계 테스트
   - 방 플로팅 위젯 compact 치수·bounds·별도 offset 저장소
2. `feat(ui): 노트북 compact 데스크톱 UI 적용`
   - 홈·검색·방 내부·공통 컨트롤 compact CSS
   - 설정·친구·방 생성·인증·신고·재생목록 모달 compact CSS
   - modal overlay와 모바일 분기는 유지

## 인수 조건

- 1366×768, 1440×900, 1536×864, 1600×900에서 compact가 적용된다.
- 1601×901, 1920×1080, 3840×2160에서는 기존 데스크톱 치수가 유지된다.
- 760px 이하에서는 기존 모바일 UI가 유지된다.
- 플로팅 위젯 drag 좌표와 시각 위치가 일치하며 normal/compact offset이 서로 덮어쓰지 않는다.
- 모달 하단 액션과 스크롤 콘텐츠가 잘리지 않는다.

## Selected skills

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 비범위

- API·React Query·WebSocket 계약 변경
- 모바일 UI 재설계
- 사용자 소유 `.searchInput` 폭·여백 변경

## 상태

- complete — Draft PR #36, local/CI/fresh QA pass
