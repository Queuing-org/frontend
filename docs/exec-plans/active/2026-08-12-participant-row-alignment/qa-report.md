# QA Report

## Result

- status: pass
- 헤더 제목과 프로필 이미지가 동일한 왼쪽 기준선을 사용한다.
- 헤더 인원 수와 참가자 관리 버튼 영역이 동일한 오른쪽 기준선을 사용한다.
- 일반·모바일·compact 화면에 동일한 정렬 규칙을 적용했다.
- 왕관 높이는 닉네임 글자 크기와 같고 SVG 원본 비율을 유지한다.
- 기존 1px 행 테두리 높이는 block padding으로 보존하고 expanded 테두리는 inset shadow로 표시한다.
- 모달 크기, 메뉴 DOM과 상호작용, 테스트 파일은 변경하지 않았다.

## Verification

- `git diff --check`: pass
- `npm run lint`: pass
- `npm run build`: pass
- fresh read-only QA: pass
