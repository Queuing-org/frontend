# 친구 추가 UI 흐름 개편

## 목표

- FRIEND 패널 헤더의 상시 사용자 검색을 `+ 친구 추가` 버튼으로 교체한다.
- 버튼을 누르면 별도 친구 추가 모달에서 사용자 검색, 선택, 팔로우를 수행한다.
- 검색 결과에는 프로필 이미지와 닉네임만 노출한다.

## 사용자 흐름

1. FRIEND 패널 우측의 `+ 친구 추가` 버튼을 누른다.
2. 친구 추가 모달의 입력창에 닉네임을 검색한다.
3. 입력창 아래 결과 목록에서 프로필 이미지와 닉네임을 확인한다.
4. 결과를 클릭하면 입력창에 닉네임이 채워지고 공개 slug는 UI에 노출하지 않는다.
5. `팔로우`를 누르면 선택한 사용자의 slug로 기존 팔로우 API를 호출한다.
6. 성공 또는 서버 오류 메시지를 입력창 아래에 표시한다.

## 상태 소유

- FRIEND 패널: 현재 탭, 친구 추가 모달 열림 여부
- 친구 추가 모달: 검색어, 선택 사용자, 검색 결과, 팔로우 성공/오류
- 서버 상태: 기존 React Query 사용자 검색 및 팔로우 mutation

## 커밋 계획

1. `feat(follow): 친구 추가 검색 모달 흐름 개편`
   - FRIEND 헤더 버튼 및 추가 모달
   - 검색 결과 단순화와 선택 동작
   - 팔로우 성공·오류 UI와 회귀 테스트

## 비범위

- 사용자 검색 API 계약 변경
- 팔로우/언팔로우 API 변경
- 사용자가 로컬에서 수정 중인 기존 `.searchInput` 폭과 여백 CSS

## Selected skills

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `queuing-api-boundary`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 상태

- verified
