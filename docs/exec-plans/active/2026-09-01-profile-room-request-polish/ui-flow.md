# UI Flow

- 설정 최애곡 input과 카운터는 40자를 기준으로 동작하고 기존 즉시 draft/완료 저장 흐름을 유지한다.
- 방·친구 프로필의 최애곡은 공유 컴포넌트에서 말줄임 없이 줄바꿈하며 두 줄 분량의 기본 공간을 확보한다.
- 방 편집 모달은 방 메인 셸의 normal/compact 너비를 따르고 mobile에서는 기존 viewport 여백을 유지한다.
- 방 편집 footer 버튼은 각 density의 select 높이와 동일하다.
- 노래 신청 모달은 필드 라벨을 `노래 선정 이유 (선택)`로 표시하고 취소·큐잉 액션에 hover/focus-visible pill 배경을 제공한다.
- YouTube URL input은 normal/mobile/compact에서 각각 같은 화면의 label 글자 크기를 사용한다.
