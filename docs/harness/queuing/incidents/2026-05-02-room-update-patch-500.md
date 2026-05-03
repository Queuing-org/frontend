# Room Update PATCH 500

## Problem

방장이 방 이름만 수정했는데 `PATCH /api/v1/rooms/{slug}` 요청이 한때 500으로 실패했다.

```text
PATCH https://api.queuing.patulus.com/api/v1/rooms/2BxBdD5N
500 Internal Server Error
```

## Previous Behavior

수정 모드에서도 폼 snapshot 전체를 payload로 만들 수 있었다.

## Previous Code

```ts
const payload = {
  title: trimmedTitle,
  password: isPasswordEnabled ? trimmedPassword : "",
  tags: selectedTagSlugs,
};
```

사용자 의도는 "방 이름만 수정"이었지만 서버는 `title`, `password`, `tags`를 함께 받을 수 있었다.

## Updated Code

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

## Problem in the Previous Code

프론트는 기존 비밀번호 원문을 알 수 없는데, 비밀번호를 수정하지 않는 상태를 필드 생략이 아니라 `password: ""`로 표현할 수 있었다. 이 값은 "비밀번호 유지", "비밀번호 제거", "빈 문자열로 변경" 중 무엇인지 API 계약상 명확하지 않다.

또한 방 이름만 수정하는 요청에 태그 전체 재설정까지 섞이면, 제목 수정과 무관한 서버 로직이 실행될 수 있어 원인 범위가 넓어진다.

## Evidence

진단용 payload 조합을 바꿔가며 같은 방에서 테스트했다.

```json
{ "title": "..." }
```

결과: 성공.

```json
{ "title": "...", "tags": ["..."] }
```

결과: 성공.

```json
{ "title": "...", "password": "" }
```

결과: 성공.

```json
{ "title": "...", "password": "", "tags": ["..."] }
```

결과: 성공.

따라서 "전체 payload" 또는 `password: ""`가 500의 직접 원인이라고 확정하지 못했다.

## Cause or Remaining Hypotheses

확정 원인: 없음.

남은 가능성:

- 서버의 일시적 내부 상태 문제
- 당시 방/태그/비밀번호 상태가 이후 테스트와 달랐던 문제
- 권한, 세션, CSRF 상태가 꼬였는데 서버가 401/403이 아닌 500을 반환한 문제
- 서버 수정 API 내부 edge case가 이후 상태 변경으로 사라진 문제

HTTP 500 자체는 서버 방어 실패다. 프론트 수정은 서버 원인을 확정한 것이 아니라, 애매한 payload를 보내지 않도록 줄인 방어적 변경이다.

## Solution Options

- 서버가 빈 문자열 `password`를 명확히 400/422로 처리한다.
- 수정 API 문서에 partial update와 password clear 규칙을 명시한다.
- 프론트가 기존 값 비교 대신 dirty field를 추적한다.
- 비밀번호 해제가 필요하면 `clearPassword: true` 같은 별도 API 계약을 추가한다.

## Chosen Solution and Rationale

프론트에서 변경된 필드만 보내는 방식을 선택했다. 이 방식은 서버 계약이 애매한 `password: ""`를 피하고, 사용자의 실제 의도와 payload를 맞춘다.

서버 검증 강화나 API 계약 변경이 더 근본적인 방법일 수 있지만, 현재 프론트에서 즉시 적용 가능한 방어적 수정은 partial payload였다. dirty field 추적은 더 명확하지만 폼 상태 관리가 커져서 이 변경 범위에서는 기존 값 비교가 더 작고 안전했다.

## Result

방 이름만 바꾸면 이제 `title`만 전송한다. 이후 기존 payload 조합으로도 500은 재현되지 않았으므로 최초 500의 직접 원인은 여전히 미확정이다.

## Reusable Rule

Room update `PATCH`에서는 사용자가 실제로 변경한 필드만 보낸다. 기존 비밀번호 원문을 모르는 프론트는 `password: ""`를 "그대로 유지" 의미로 보내면 안 된다.

원인이 재현되지 않은 500은 확정 원인처럼 문서화하지 말고, 검증된 payload와 남은 가설을 분리해서 기록한다.

## Skill or Team Spec Updates

- Updated: `.agents/skills/queuing-api-boundary/SKILL.md`
- Updated: `.agents/skills/queuing-qa-reviewer/SKILL.md`
- Covered by: `docs/harness/queuing/team-spec.md`

## Verification

After the frontend change, room title-only updates send only `title`. Later tests could not reproduce the original 500 with the old payload combinations, so root cause remains unconfirmed.
