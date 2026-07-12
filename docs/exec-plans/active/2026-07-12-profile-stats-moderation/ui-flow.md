# UI Flow

## 상태 소유권

- 프로필: query hook이 서버 상태, 패널은 표시와 추천 버튼 조건을 소유
- 차단 모달: 대상 사용자, pending/error/success 화면을 모달 로컬 상태와 mutation 상태로 표현
- 신고 모달: 선택된 사유와 인라인 오류를 모달 로컬 상태로 표현
- 채팅 메뉴: `ChatArea`가 열린 메시지 한 건과 대상 모달을 소유

## 접근성/닫힘

- hover뿐 아니라 focus-within으로 관리 버튼을 노출한다.
- 한 번에 한 메뉴만 열고 바깥 클릭, Escape, 스크롤로 닫는다.
- 메뉴 버튼은 `aria-expanded`, `aria-controls`, `aria-haspopup`를 제공한다.
- 메뉴/모달 종료 시 트리거로 포커스를 복원한다.
- 요청 중에는 모달 닫기와 중복 제출을 막는다.
