# UI Flow

## 상태 소유

- CSS media query가 홈·검색·모달의 compact geometry를 소유한다.
- 방 플로팅 위젯 hook은 동일 viewport 계약으로 JS bounds와 저장 offset namespace를 선택한다.
- 서버 상태와 화면 상호작용 상태에는 compact 여부를 섞지 않는다.

## 시각 규칙

- full viewport overlay/background는 축소하지 않는다.
- 고정 width/height/padding/gap/font/icon/offset은 80% 값으로 전환한다.
- normal desktop와 mobile 스타일은 기존 값을 유지한다.
- overlay 안 dialog만 줄이고 필요한 경우 내부 스크롤을 제공한다.
