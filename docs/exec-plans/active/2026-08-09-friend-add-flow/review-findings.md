# PR #35 Review Findings

## Actionable

1. 친구 추가 모달 포커스 트랩
   - 관련 스레드 3개는 같은 접근성 문제를 지적한다.
   - Tab/Shift+Tab 순환과 기존 트리거 포커스 복귀를 테스트한다.
2. 진행 중 follow mutation 상태 보존
   - 관련 스레드 2개는 `reset()`이 네트워크 요청을 취소하지 않는 같은 경합을 지적한다.
   - pending 중 feedback reset을 막고 회귀 테스트를 추가한다.
3. 팔로우 탭 개수 표기 계약
   - `hasNext`이면 첫 페이지 실제 길이와 무관하게 `100+`를 표시한다.
4. 빈 목록 전환 시 차단 완료 모달 유지
   - 팔로잉·팔로워 마지막 사용자를 차단해도 열린 모달을 유지한다.
5. 저높이 화면 모달 접근성
   - 친구 추가 모달에 높이 제한과 세로 스크롤을 제공한다.
6. active 실행 계획 인덱스 상태
   - 링크형 항목에도 실제 lifecycle 상태를 추가한다.

## CI

- GitHub Actions `Lint, test, and build`: pass
- Vercel: pass

## 제외

- CodeRabbit docstring coverage 경고는 프로젝트의 TypeScript 함수 문서화 규약이나 required check가 아니므로 이번 수정 범위에서 제외한다.

## 검증 결과

- 6개 actionable 묶음 모두 코드 또는 문서에 반영했다.
- Targeted: 5 files / 17 tests pass
- Full: 70 files / 194 tests pass
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- GitHub thread reply/resolve는 사용자 요청 범위를 넘으므로 수행하지 않는다.
