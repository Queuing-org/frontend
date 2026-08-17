# Change Summary

- 설정 닉네임 input에 현재 글자 수/19 counter를 추가하고 입력·제출 상한을 19자로 통일했다.
- React Query test client/provider 중복을 공통 helper로 만들고 가장 큰 query-heavy room 테스트부터 적용했다.
- 1,011줄 `RoomPlaybackScreen`을 join/session 조율과 joined room UI로 분리했다.
- Room profile의 음악력 API 상태를 hook, button UI를 control로 분리하고 중복 통합 테스트를 작은 경계 테스트로 교체했다.
- 핵심 시나리오를 유지하면서 유효 테스트 코드는 10줄만 줄었고, 직접 QueryClient 생성 17회, 최대 테스트 파일 172줄, 최대 운영 파일 223줄을 줄였다.
