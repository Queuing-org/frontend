# QA Report

## 자동 검증

- Targeted tests: 3 files / 10 passed
- Design-token regression tests: 2 files / 8 passed
- Review regression tests: 5 files / 17 passed
- Full tests: 70 files / 194 passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

## Fresh read-only QA

- Result: pass
- FRIEND 헤더와 친구 추가 모달 상태 소유가 분리되어 있다.
- 검색 결과는 프로필 이미지와 닉네임만 표시한다.
- 선택 시 닉네임을 입력값으로 사용하고 내부 slug로 follow mutation을 호출한다.
- 기존 `useFollow`의 follow/user search cache 무효화가 유지된다.
- 성공 및 서버 오류 feedback, Escape 닫기, IME Enter 방지 테스트를 확인했다.
- 부모 FRIEND 패널은 하위 모달이 열린 동안 `inert` 처리되고, 닫으면 친구 추가 버튼으로 focus를 복원한다.
- 친구 추가 버튼의 119×36 크기, 10×10 아이콘, 14px extra-bold 및 지정 색상이 정확히 반영되었다.
- 모달 제목·설명·입력창·피드백·액션의 크기, 굵기, 색상, padding, gap, radius가 전달된 토큰과 일치한다.
- 리뷰 대응에서 Tab/Shift+Tab 포커스 순환, pending mutation 보존, 저높이 화면 스크롤을 회귀 검증한다.
- 마지막 팔로잉·팔로워 차단 후 빈 목록으로 전환되어도 차단 완료 모달이 유지되는지 검증한다.
- `hasNext` 탭 개수는 실제 첫 페이지 길이와 무관하게 API page size 기준 `100+`로 표시한다.
- 저높이 화면에서는 모달 높이를 제한하고 내부 세로 스크롤로 하단 액션 접근성을 유지한다.

## 잔여 위험

- 사용자가 별도로 수정한 기존 `.searchInput` 규칙은 검색 컴포넌트 삭제 후 현재 미사용이지만, 사용자 소유 변경을 보존하기 위해 이번 커밋에서 해당 두 줄을 제외한다.
- 수동 브라우저 QA는 실행하지 못했으며 제공된 스크린샷과 컴포넌트 테스트를 기준으로 검증했다.
