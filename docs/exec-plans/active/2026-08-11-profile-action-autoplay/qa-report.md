# QA Report

## 판정

- pass

## 프로필 액션

- 상태 박스, 팔로우, 관리의 선언 높이는 normal 28px, compact 22.4px로 일치한다.
- 팔로우·관리 버튼에 `box-sizing: border-box`를 적용해 padding과 border가 선언 높이 밖으로 늘어나지 않는다.
- 상태 박스와 액션 행에 `flex-shrink: 0`을 적용해 고정 높이 프로필 패널 안에서도 실제 높이가 압축되지 않는다.
- 최신 diff를 별도 read-only reviewer가 정적 검토했고 blocking finding 없이 pass했다.

## YouTube autoplay

- 기존 iframe permission token을 보존하면서 `autoplay` token만 중복 없이 추가한다.
- player ready 뒤 PLAYING 상태는 현재 곡과 시각으로 load 후 play를 다시 요청한다.
- PAUSED 상태는 cue 및 pause를 유지하며 autoplay 보강 때문에 재생되지 않는다.
- 소리 있는 자동재생의 최종 허용 여부는 브라우저 정책에 달려 있어 웹 코드로 보장하지 않는다.

## 검증 기록

- player/profile targeted: 2 files / 33 tests pass
- profile final targeted: 1 file / 27 tests pass
- lint: pass
- build: player 변경 포함 상태에서 pass
- 전체 테스트 병렬 실행은 자원 경합 timeout이 있었고 실패 4 files / 31 tests 단독 재실행은 pass
- 최종 CSS-only 수정 뒤 추가 build는 사용자가 테스트 중단을 요청해 실행하지 않았다.

## 잔여 위험

- 연결 브라우저가 없어 실제 픽셀 비교와 새로고침 autoplay 허용/차단 경로를 직접 확인하지 못했다.
- PR CI 결과로 최종 원격 상태를 확인해야 한다.
