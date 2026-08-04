# 팔로우 presence·프로필·queue UI 정리

## Scope

- 공유 `dev` 브랜치에서 팔로워/팔로잉 presence 표현을 통합한다.
- 음악력의 선택/취소 UI를 단발 PUT 평가로 단순화한다.
- 설정의 최애 곡을 제거하고 대표 칭호 해제를 연결한다.
- queue의 지난 곡 기능을 제거하고 전체 트랙에 현재 재생 곡을 표시한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership

- follow presence 서버 상태와 버전 병합: 기존 TanStack Query cache 및 전역 presence 구독
- follower/following 카드 표현과 방 이동: follow feature 공용 leaf component
- 음악력 mutation/cache: profile API hook, 유효 대상 및 오류 표현: room profile panel
- 대표 칭호 설정/해제 mutation: badge feature, 선택 UI: settings feature
- 현재 재생 곡: 상위 room playback query, queue 표현/정렬: room queue feature

## Commit Slices

1. `feat(follow): 팔로우 접속 상태 카드 통합`
2. `feat(profile): 음악력 평가와 대표 칭호 해제 단순화`
3. `refactor(queue): 지난 곡 제거와 현재 곡 표시`
4. `docs(delivery): UI 정리 검증 결과 기록`

## Acceptance Criteria

- 온라인/오프라인 점과 상태 문구가 팔로워·팔로잉에 동일하게 표시된다.
- 방 제목은 비대화형 텍스트이며 우측 화살표만 방으로 이동한다.
- 팔로잉 카드에서 언팔로우 기능이 제거된다.
- 음악력은 UP/DOWN PUT만 제공하고 선택/취소/로컬 쿨다운 상태가 없다.
- 대표 칭호가 있는 상태에서 `칭호 없음`을 선택하면 DELETE 해제 요청과 캐시 무효화가 실행된다.
- 설정의 최애 곡과 queue의 지난 곡 관련 기능이 제거된다.
- 전체 트랙 첫 항목에 현재 재생 곡이 중복 없이 `PLAY`로 표시되며 pending count에는 포함되지 않는다.
- `npm run lint`, `npm run test`, `npm run build`, fresh QA가 통과한다.

## Progress

- [x] dev/main 동기화
- [x] 실행 계획 생성
- [x] follow UI 통합
- [x] 음악력/칭호 설정 변경
- [x] queue history 제거 및 현재 곡 병합
- [x] targeted/full QA
- [x] 기능 단위 commit
- [ ] push/Draft PR

## Residual Risk

- 실제 1시간 음악력 제한 문구는 backend 오류 응답에 의존하며 프론트는 별도 타이머를 두지 않는다.
- presence의 `room`은 공개 방만 제공된다는 기존 API 계약을 유지한다.
- 브라우저 자동화 연결이 실행 환경 메타데이터 오류로 시작되지 않아 픽셀 단위 QA는 남아 있다.
