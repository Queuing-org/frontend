# Change Summary

- 생성·수정의 썸네일 설정을 동일한 업로드/기본 이미지 카드 컴포넌트와 CSS로 통합했다.
- 파일 선택 뒤 나타나던 X를 제거하고 기본 이미지 카드가 선택 해제를 담당하도록 변경했다.
- 수정에서 기존 서버 이미지를 기본 이미지로 바꾸어 저장하면 v2 DELETE를 호출한다.
- 썸네일 삭제 mutation과 cache invalidation, PUT/DELETE 상호배제, 부분 저장 재시도를 추가했다.
- 수정 모달 test fixture를 override 방식으로 정리해 새 상태 필드 추가에 따른 중복을 줄였다.
