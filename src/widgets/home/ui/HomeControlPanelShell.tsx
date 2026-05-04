"use client";

import styles from "./HomeControlPanelShell.module.css";

const menuItems = ["QUE", "CREATE", "FRIEND", "SETTING"] as const;
const genreFilterOptions = [
  "ALL",
  "POP",
  "K-POP",
  "J-POP",
  "ANIMATION",
  "BAND",
  "HIP-HOP",
] as const;
const dateFilterOptions = ["RANDOM", "OLD", "NEW"] as const;
const participantsFilterOptions = ["RANDOM", "HIGH", "LOW"] as const;

export type HomeMenuItem = (typeof menuItems)[number];

export const HOME_CONTROL_PANEL_IDS = {
  menu: "home-menu-panel",
  filter: "home-filter-panel",
} as const;

type Props =
  | {
      variant: "menu";
      activeMenuItem: HomeMenuItem;
      onSelectMenuItem: (menuItem: HomeMenuItem) => void;
    }
  | {
      variant: "filter";
      activeFilters: HomeFilterState;
      onSelectFilter: (key: HomeFilterKey, option: HomeFilterOption) => void;
    };

const filterSections = [
  {
    key: "genre",
    title: "Genre",
    options: genreFilterOptions,
  },
  {
    key: "date",
    title: "Date",
    options: dateFilterOptions,
  },
  {
    key: "participants",
    title: "Participants",
    options: participantsFilterOptions,
  },
] as const;

export type HomeFilterKey = (typeof filterSections)[number]["key"];
export type HomeGenreFilterOption = (typeof genreFilterOptions)[number];
export type HomeDateFilterOption = (typeof dateFilterOptions)[number];
export type HomeParticipantsFilterOption =
  (typeof participantsFilterOptions)[number];
export type HomeFilterOption =
  | HomeGenreFilterOption
  | HomeDateFilterOption
  | HomeParticipantsFilterOption;
export type HomeFilterState = {
  genre: HomeGenreFilterOption[];
  date: HomeDateFilterOption;
  participants: HomeParticipantsFilterOption;
};

export const DEFAULT_HOME_FILTERS: HomeFilterState = {
  genre: ["ALL"],
  date: "RANDOM",
  participants: "RANDOM",
};

export function getNextHomeFilters(
  currentFilters: HomeFilterState,
  key: HomeFilterKey,
  option: HomeFilterOption,
): HomeFilterState {
  if (key === "genre") {
    const genreOption = option as HomeGenreFilterOption;

    if (genreOption === "ALL") {
      return {
        ...currentFilters,
        genre: ["ALL"],
      };
    }

    const selectedGenres = currentFilters.genre.filter(
      (genre) => genre !== "ALL",
    );
    const nextGenres = selectedGenres.includes(genreOption)
      ? selectedGenres.filter((genre) => genre !== genreOption)
      : [...selectedGenres, genreOption];

    return {
      ...currentFilters,
      genre: nextGenres.length > 0 ? nextGenres : ["ALL"],
    };
  }

  if (key === "date") {
    return {
      ...currentFilters,
      date: option as HomeDateFilterOption,
    };
  }

  return {
    ...currentFilters,
    participants: option as HomeParticipantsFilterOption,
  };
}

function isFilterOptionActive(
  filters: HomeFilterState,
  key: HomeFilterKey,
  option: HomeFilterOption,
) {
  if (key === "genre") {
    return filters.genre.includes(option as HomeGenreFilterOption);
  }

  return filters[key] === option;
}

export default function HomeControlPanelShell(props: Props) {
  const { variant } = props;
  const panelId = HOME_CONTROL_PANEL_IDS[variant];

  if (variant === "menu") {
    return (
      <section
        id={panelId}
        className={`${styles.panel} ${styles.menuPanel}`}
        aria-label="홈 메뉴 패널"
      >
        <div className={styles.menuRow}>
          {menuItems.map((item) => {
            const isActive = item === props.activeMenuItem;

            return (
              <button
                key={item}
                type="button"
                className={`${styles.menuItem} ${isActive ? styles.activeChip : ""}`}
                aria-pressed={isActive}
                onClick={() => props.onSelectMenuItem(item)}
              >
                {item}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section
      id={panelId}
      className={`${styles.panel} ${styles.filterPanel}`}
      aria-label="홈 필터 패널"
    >
      {filterSections.map((section) => (
        <div key={section.title} className={styles.filterSection}>
          <span className={styles.sectionTitle}>{section.title}</span>
          <div className={styles.optionGrid}>
            {section.options.map((option) => {
              const isActive = isFilterOptionActive(
                props.activeFilters,
                section.key,
                option,
              );

              return (
                <button
                  key={option}
                  type="button"
                  className={`${styles.optionChip} ${
                    isActive ? styles.activeChip : ""
                  }`}
                  aria-pressed={isActive}
                  onClick={() => props.onSelectFilter(section.key, option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
