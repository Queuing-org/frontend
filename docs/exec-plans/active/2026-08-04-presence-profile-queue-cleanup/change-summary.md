# Change Summary

- 팔로워·팔로잉 presence 카드를 통합하고 온라인/오프라인 점, 상태 문구, 방 이동 화살표를 적용했다.
- 음악력 선택/취소 상태를 없애고 1시간 평가 안내가 있는 PUT-only UI로 단순화했다.
- 설정의 최애 곡을 제거하고 대표 칭호 해제 API 및 cache 동기화를 추가했다.
- 지난 곡 기능을 제거하고 전체 트랙에 현재 재생 곡을 표시했다.
- lint, 46 files / 113 tests, build, fresh QA를 통과했다.
- 긴 사연을 overflow-only 순환 marquee로 바꾸고 방 프로필의 최애곡을 한 줄 소개로 교체했으며 정적 음악력 제한 문구를 제거했다.
- 칭호 획득 모달을 새 축하 디자인과 lazy-loaded confetti 효과로 개선했다.
- 차단 목록 cursor 조회/해제를 추가하고 follower/following 카드 확장 액션에 관계 토글과 차단을 연결했다.
- 후속 범위까지 lint, 51 files / 125 tests, build, diff-check, fresh QA를 통과했다.
- 첫 Vercel preview의 stale pnpm lock 실패를 수정하고 deployer와 같은 frozen install을 publish gate에 추가했다.
- 재생목록과 현재 재생 신청자 카드의 긴 곡 제목에 overflow-only marquee를 적용하고, 활성 곡 썸네일의 `PLAY` 문구를 reduced-motion 대응 3-bar equalizer로 교체했다.
- 최종 lint, 52 files / 126 tests, build, diff-check, fresh read-only QA를 통과했다.
- 현재 재생 썸네일 전체에 `#ffffff` 60% 오버레이를 적용하고 equalizer 막대를 `#3c3c3c`로 중앙 정렬했다.
