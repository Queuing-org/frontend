# API 및 캐시 경계

팔로잉·팔로워 응답에는 전체 인원 수가 없다.

```ts
type FollowListResponse = {
  items: FollowUser[];
  hasNext: boolean;
  nextCursor: number | null;
};
```

따라서 탭의 수는 기존 목록과 동일한 React Query key 및 첫 페이지(`size=100`)를 재사용한다. `hasNext`가 `true`이면 정확한 전체 개수를 알 수 없으므로 `100+`로 표시한다. 탭 개수를 위해 모든 cursor 페이지를 추가 호출하지 않는다.
