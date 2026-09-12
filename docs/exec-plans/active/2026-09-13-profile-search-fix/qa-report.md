# QA Report

- 독립 reviewer: qa_profile_search (read-only)
- 코드 판정: pass — 차단 이슈 없음.
- 원 요청: 이용 시간을 큐잉 횟수 높이에 정렬하고 엔터 없이 지속되는 제목 검색의 원인을 파악.

## 경계 검토

- 프로필: 두 statsColumn이 동일한 3행 subgrid를 공유하며 최애곡의 강제 2lh 공간을 제거했다. 짧은 문구의 이용 시간은 기존 큐잉 횟수 높이로 올라간다. 긴 문구는 양쪽 둘째 행을 함께 밀어 겹침과 불일치를 막는다.
- 검색: 조합 종료와 자동 검색을 분리하고 입력값 300ms 디바운스를 유지했다. 조합 ref / native isComposing / keyCode 229 키보드 선택 방어는 유지한다.
- API/캐시: endpoint, query key, 계정 분리, cache staleTime, AbortSignal, URL 분류, 오류 처리는 변경하지 않았다. mutation 영향 없음.
- 회귀: 조합 종료 없이 결과 표시, 40회 입력 버스트 이후 1회 요청, 60초 유휴 재요청 없음.

## 실행 근거

- 수정 전 회귀 2건 실패: 조합 중 새 검색이 호출되지 않음.
- targeted: 2 files / 9 tests passed.
- npm run lint: pass, 경고 없음.
- npm run test: 160 files / 714 tests passed.
- npm run build: 첫 sandbox 실행은 컴파일 시작 이후 진행 출력이 없어 중단, 제한 밖 동일 명령 재실행 pass.
- git diff --check: pass.

## 잔여 제한

- Browser 초기화 후 discovery가 []라 실제 화면 좌표 및 OS IME는 미검증.
- 운영 API 응답 시간은 미관측. 300ms는 검색 시작 디바운스이며 완료 시간 보장이 아니다.
- 기존 취소 테스트는 교체 중 abort를 검증하지만 닫기 중 in-flight abort를 직접 assert하지 않는다. 이번 변경에서 취소 경로는 유지됨.
