import { expect, it } from "vitest";
import { getDisplayRoomTags } from "./getDisplayRoomTags";

it("빈 태그는 FREE 표시 태그로 변환한다", () => {
  expect(getDisplayRoomTags([])).toEqual([{ slug: "free", name: "FREE" }]);
});

it("서버 태그가 있으면 순서와 참조를 보존한다", () => {
  const tags = [{ slug: "rock", name: "록" }];

  expect(getDisplayRoomTags(tags)).toBe(tags);
});
