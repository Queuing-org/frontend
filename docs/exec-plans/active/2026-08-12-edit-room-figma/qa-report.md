# QA Report

## Result

- status: pass
- 816px 세로 panel, bordered EDIT pill, 중앙 thumbnail, filled title, genre chips, label-control settings, dark footer button을 피그마 구조에 맞췄다.
- 본문만 scroll되고 header/footer는 고정되어 짧은 viewport에서도 완료 버튼이 유지된다.
- 참여 제한 menu는 마지막 control 위로 열려 footer나 viewport 아래에 잘리지 않는다.
- 기존 password 유지 시 field를 보내지 않고, 새 값은 문자열, 공개 전환은 null로 보내는 기존 payload 의미를 보존한다.
- 같은 참여 제한 option을 다시 선택해도 작성 중인 password를 지우지 않는다.
- thumbnail upload, delete confirm/error, QueryBoundary, submit error와 focus 복원 흐름을 유지한다.
- overlay에는 YouTube iframe 합성 리스크가 있는 backdrop-filter를 사용하지 않았다.
- API/hook/cache와 테스트 파일은 변경하지 않았다.

## Verification

- `git diff --check`: pass
- `npm run lint`: pass
- `npm run build`: pass
- fresh read-only QA: pass after one bounded fix cycle

## Residual Risk

- 연결 가능한 browser instance가 없어 실제 로그인 방에서의 픽셀 단위 시각 QA는 수행하지 못했다. 제공된 원본 이미지와 DOM/CSS 수치를 기준으로 정적 검토했다.
