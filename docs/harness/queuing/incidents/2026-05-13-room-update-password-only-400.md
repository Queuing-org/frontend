# Room Update Password-Only 400

## Problem

방 수정 모달에서 방 제목과 비밀번호를 같이 수정하면 성공하지만, 비밀번호만 수정하면 `PATCH /api/v1/rooms/{slug}`가 400으로 실패했다.

```text
Failed to load resource: the server responded with a status of 400 ()
```

사용자에게는 "입력값이 잘못됐습니다" 계열 오류가 표시됐다.

## Previous Behavior

수정 폼은 변경된 필드만 payload에 넣었다. 방 제목이 그대로이고 비밀번호만 입력된 경우 요청 body는 `password`만 포함할 수 있었다.

## Previous Code

```ts
const updatePayload: UpdateRoomPayload = {};

if (trimmedTitle !== initialTitle.trim()) {
  updatePayload.title = trimmedTitle;
}

if (!haveSameItems(selectedTagSlugs, initialTagSlugs)) {
  updatePayload.tags = selectedTagSlugs;
}

if (isPasswordEnabled && trimmedPassword) {
  updatePayload.password = trimmedPassword;
}
```

비밀번호만 수정할 때 가능한 요청:

```json
{ "password": "1234" }
```

## Updated Code

```ts
const updatePayload: UpdateRoomPayload = {};

if (!haveSameItems(selectedTagSlugs, initialTagSlugs)) {
  updatePayload.tags = selectedTagSlugs;
}

if (isPasswordEnabled && trimmedPassword) {
  updatePayload.password = trimmedPassword;
}

if (
  trimmedTitle !== initialTitle.trim() ||
  Object.keys(updatePayload).length > 0
) {
  updatePayload.title = trimmedTitle;
}
```

비밀번호만 수정할 때 변경된 요청:

```json
{ "password": "1234", "title": "현재 방 제목" }
```

## Problem in the Previous Code

이전 partial update 규칙은 기존 비밀번호 원문을 모르는 프론트가 `password: ""` 같은 애매한 값을 보내지 않는 데는 맞았다. 하지만 실제 서버는 비밀번호만 들어간 payload를 `400 invalid-input`으로 거절했다.

API 문서는 방 정보 수정 예시 body에 `tags`, `title`, `password`를 함께 보여주지만, 필드별 optional/partial update 규칙은 명확히 설명하지 않는다. 그래서 "비밀번호만 변경"이라는 사용자 의도는 맞았지만, 서버 validation이 허용하는 요청 형태와 맞지 않았다.

## Evidence

- confirmed reproduction steps: 사용자가 방 수정 모달에서 비밀번호만 수정하면 400이 난다고 보고했다.
- requests/responses tested: 로컬에서 live API 재현은 하지 못했다.
- logs/screenshots: 브라우저 리소스 로드 오류 `400`.
- cases that did not reproduce: 방 제목과 비밀번호를 같이 수정하면 성공한다고 보고됐다.
- API docs: `PATCH /api/v1/rooms/{slug}`는 방 제목, 비밀번호, 태그 수정 API이며 예시 body가 `title`, `password`, `tags`를 함께 포함한다.
- after-change behavior: 비밀번호 변경 요청에도 현재 제목을 함께 보낸다.

## Cause or Remaining Hypotheses

확정 원인: 프론트가 비밀번호만 바뀐 경우 `title` 없이 `password`만 보낼 수 있었다.

남은 가설: 서버 validation이 `title` 필드를 실질적으로 필수로 보고 있을 가능성이 높다. 다만 live API 재현과 fieldErrors 확인은 하지 못했으므로 서버 내부 원인은 가설로 남긴다.

## Solution Options

- option 1: 서버가 `password` only PATCH를 허용하도록 수정한다.
- option 2: 프론트가 room update 요청마다 현재 `title`을 항상 포함한다.
- option 3: 프론트가 `password` 또는 `tags` 변경 시에만 현재 `title`을 같이 포함하고, no-op 요청은 보내지 않는다.

## Chosen Solution and Rationale

option 3을 선택했다. 기존 비밀번호 원문을 모르는 문제는 그대로 피하면서, 서버가 거절하는 password-only payload만 방어할 수 있다.

모든 요청에 제목을 무조건 넣는 방식은 no-op 수정에서도 API 호출을 만들 수 있다. 서버 수정이 근본 해결이지만, 현재 프론트에서 즉시 적용할 수 있는 최소 변경은 "변경이 하나라도 있으면 현재 제목 포함"이다.

## Result

비밀번호만 수정해도 payload가 `password + title` 형태가 되어, 사용자가 보고한 400 케이스를 피한다. 제목만 수정하는 기존 케이스는 여전히 `title`만 보낸다.

## Reusable Rule

Room update에서는 `password: ""`처럼 의미가 애매한 secret 값을 보내지 않는다. 단, 현재 API는 password-only payload를 거절하므로, 변경 요청이 하나라도 있으면 현재 non-empty `title`을 함께 보낸다.

## Skill or Team Spec Updates

- skill updated: `.agents/skills/queuing-api-boundary/SKILL.md`
- team spec updated: no update because this is a narrow API payload rule.

## Verification

- `npm run lint`
- `npm run build`
