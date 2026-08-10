# QA Report

## Result

- fresh QA: `pass`
- blocking findings: none

## Verification

- targeted: 2 files, 15 tests passed
- full suite: 105 files, 323 tests passed
- lint: passed
- production build: passed
- diff check: passed

## Boundary Review

- 참가자 목록의 mounted card 상한은 24개로 유지된다.
- 열린 virtual row만 높은 stacking 순서를 가지며 메뉴를 자르던 paint containment는 제거됐다.
- 메뉴의 위/아래 배치와 스크롤 시 닫기 동작은 유지된다.
- 채팅 confirmation timeout은 pending, sending 상태, timer를 정리하되 오류 문구를 만들지 않는다.
- backend가 보낸 실제 채팅 오류 문구는 기존 경로로 계속 노출된다.

## Excluded Request

- 방 사진 수정은 backend `main`에 저장 계약이 없고 사용자가 backend 변경을 진행하지 않기로 해 미반영했다.

## Residual Risk

- 실제 브라우저 paint 결과를 수동 확인하지는 않았다.
- 메뉴보다 목록 자체가 짧은 극단적인 viewport에서는 목록 overflow에 의해 일부가 잘릴 수 있다.
