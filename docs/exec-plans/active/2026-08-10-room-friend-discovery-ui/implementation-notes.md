# Implementation Notes

- 공통 공개 프로필 표현은 user profile feature가 소유한다. 방 전용 음악력 투표와 관리 action은 room profile이 slot으로 조합하고 follow 상세에는 전달하지 않는다.
- 관리 menu의 DOM focus, outside pointer, Escape, placement와 shadow/text alignment는 shared shell이 소유한다.
- browser visual QA를 시도했으나 현재 세션의 연결 가능한 browser instance가 0개여 실행하지 못했다. 자동화 테스트, production build, 정적 CSS/DOM 검토와 구분해 기록한다.
- 전체 테스트의 첫 병렬 실행에서는 시스템 부하로 5개 테스트가 5초 제한을 넘겼다. 실패한 4개 파일 33개 테스트를 단일 worker로 재실행해 통과했고, 이어 원 명령 `npm run test`를 다시 실행해 108개 파일 330개 테스트가 모두 통과했다.
- 첫 production build는 완료된 fresh QA가 남긴 고아 `next build` 프로세스의 `.next/lock` 때문에 시작되지 않았다. 해당 프로세스를 종료한 뒤 같은 명령으로 정상 빌드했다.
