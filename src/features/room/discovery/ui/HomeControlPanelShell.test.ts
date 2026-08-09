import { describe, expect, it } from "vitest";
import {
  ALL_GENRE_FILTER_OPTION,
  DEFAULT_HOME_FILTERS,
  getHomeGenreFilterOptions,
  getNextHomeFilters,
  getSelectedHomeGenreTags,
} from "./HomeControlPanelShell";

describe("홈 장르 필터", () => {
  const tags = [
    { name: "애니", slug: "anime" },
    { name: "재즈", slug: "jazz" },
    { name: "케이팝", slug: "kpop" },
    { name: "록", slug: "rock" },
  ];

  it("태그를 실제 선택 가능한 옵션으로 제공한다", () => {
    const options = getHomeGenreFilterOptions({ tags });

    expect(options.slice(1)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ disabled: false, value: "anime" }),
        expect.objectContaining({ disabled: false, value: "kpop" }),
      ]),
    );
  });

  it("ALL UI 상태는 API 태그 조건에서 제외한다", () => {
    expect(getSelectedHomeGenreTags([ALL_GENRE_FILTER_OPTION])).toEqual([]);
    expect(getSelectedHomeGenreTags(["anime", "kpop"])).toEqual([
      "anime",
      "kpop",
    ]);
  });

  it("최대 3개 선택 후 선택하지 않은 옵션만 비활성화한다", () => {
    const options = getHomeGenreFilterOptions({
      selectedGenres: ["anime", "jazz", "kpop"],
      tags,
    });

    expect(options.find((option) => option.value === "anime")?.disabled).toBe(
      false,
    );
    expect(options.find((option) => option.value === "rock")).toEqual(
      expect.objectContaining({
        disabled: true,
        disabledReason: "장르는 최대 3개까지 선택할 수 있습니다.",
      }),
    );
  });

  it("선택·해제·ALL 복귀와 3개 상한을 지킨다", () => {
    const one = getNextHomeFilters(DEFAULT_HOME_FILTERS, "genre", "anime");
    const two = getNextHomeFilters(one, "genre", "jazz");
    const three = getNextHomeFilters(two, "genre", "kpop");
    const overLimit = getNextHomeFilters(three, "genre", "rock");

    expect(three.genre).toEqual(["anime", "jazz", "kpop"]);
    expect(overLimit).toBe(three);
    expect(getNextHomeFilters(three, "genre", "jazz").genre).toEqual([
      "anime",
      "kpop",
    ]);
    expect(
      getNextHomeFilters(three, "genre", ALL_GENRE_FILTER_OPTION).genre,
    ).toEqual([ALL_GENRE_FILTER_OPTION]);
  });
});
