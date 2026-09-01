# Change Summary

- `UserBadge.acquisitionRate`를 `number | null`로 정규화하고 두 badge GET client가 공용 mapper를 사용하도록 변경했다.
- 설정 프로필의 네이티브 select를 portal 기반 접근성 badge listbox로 교체했다.
- 획득 칭호 hover/키보드 탐색 tooltip, fallback 문구, 좌우 viewport 배치와 요청된 키보드/닫기 동작을 추가했다.
- API 숫자/문자열/invalid 경계와 설정 선택/해제/tooltip/키보드/disabled 회귀 테스트를 보강했다.
- 방과 친구의 공개 profile UI는 변경하지 않았다.
