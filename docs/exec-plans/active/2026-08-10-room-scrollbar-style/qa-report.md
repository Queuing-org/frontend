# QA Report

## Result

- fresh QA: `pass`
- blocking findings: none

## Verification

- targeted: 2 files, 19 tests passed
- full suite: 105 files, 323 tests passed
- lint: passed
- production build: passed
- diff check: passed

## Browser Boundary

- Firefox: `scrollbar-width: thin`, 투명 track의 `scrollbar-color`
- Chromium/Safari: 8px WebKit scrollbar, 투명 track/corner, 연한 둥근 thumb
- Windows Chromium: scrollbar button을 `display: none`과 0 크기로 제거
- 참가자 목록의 기존 scrollbar 완전 숨김 규칙 제거

## Residual Risk

- 실제 Windows Chrome/Edge/Firefox의 native 렌더링은 수동 확인하지 않았다.
- Firefox의 세부 외형은 OS 접근성 및 스크롤바 설정에 따라 달라질 수 있다.
