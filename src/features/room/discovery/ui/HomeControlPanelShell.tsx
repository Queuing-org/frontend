"use client";

import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { MAX_ROOM_TAG_FILTERS } from "@/src/features/room/model/roomTagFilters";
import styles from "./HomeControlPanelShell.module.css";

const menuItems = ["RANDOM", "CREATE", "FOLLOW", "SETTING"] as const;
const dateFilterOptions = ["RANDOM", "OLD", "NEW"] as const;
const participantsFilterOptions = ["RANDOM", "HIGH", "LOW"] as const;
export const ALL_GENRE_FILTER_OPTION = "ALL";

export type HomeMenuItem = (typeof menuItems)[number];

export const HOME_CONTROL_PANEL_IDS = {
  menu: "home-menu-panel",
  filter: "home-filter-panel",
} as const;

type Props =
  | {
      variant: "menu";
      isRandomEntryPending?: boolean;
      onMenuItemIntent?: (menuItem: HomeMenuItem) => void;
      onSelectMenuItem: (menuItem: HomeMenuItem) => void;
    }
  | {
      variant: "filter";
      activeFilters: HomeFilterState;
      genreOptions: HomeGenreFilterOptionDescriptor[];
      onSelectFilter: (key: HomeFilterKey, option: HomeFilterOption) => void;
    };

export type HomeFilterKey = "genre" | "date" | "participants";
export type HomeGenreFilterOption = string;
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
export type HomeFilterOptionDescriptor<Option extends string = string> = {
  disabled?: boolean;
  disabledReason?: string;
  label: string;
  loading?: boolean;
  statusLabel?: string;
  value: Option;
};
export type HomeGenreFilterOptionDescriptor =
  HomeFilterOptionDescriptor<HomeGenreFilterOption>;
type HomeGenreTag = {
  name: string;
  slug: string;
};

export const DEFAULT_HOME_FILTERS: HomeFilterState = {
  genre: [ALL_GENRE_FILTER_OPTION],
  date: "RANDOM",
  participants: "RANDOM",
};

export function getSelectedHomeGenreTags(
  genres: readonly HomeGenreFilterOption[],
) {
  return genres.filter((genre) => genre !== ALL_GENRE_FILTER_OPTION);
}

export function getHomeGenreFilterOptions({
  isError = false,
  isLoading = false,
  selectedGenres = [],
  tags = [],
}: {
  isError?: boolean;
  isLoading?: boolean;
  selectedGenres?: readonly HomeGenreFilterOption[];
  tags?: readonly HomeGenreTag[];
}): HomeGenreFilterOptionDescriptor[] {
  const allOption: HomeGenreFilterOptionDescriptor = {
    label: ALL_GENRE_FILTER_OPTION,
    value: ALL_GENRE_FILTER_OPTION,
  };

  if (isLoading) {
    return [
      allOption,
      {
        disabled: true,
        label: "",
        loading: true,
        value: "__GENRE_FILTER_LOADING__",
      },
    ];
  }

  if (isError) {
    return [
      allOption,
      {
        disabled: true,
        label: "장르 로딩 실패",
        value: "__GENRE_FILTER_ERROR__",
      },
    ];
  }

  const selectedTagSlugs = new Set(getSelectedHomeGenreTags(selectedGenres));
  const hasReachedSelectionLimit =
    selectedTagSlugs.size >= MAX_ROOM_TAG_FILTERS;

  return [
    allOption,
    ...tags.map((tag) => ({
      disabled: hasReachedSelectionLimit && !selectedTagSlugs.has(tag.slug),
      disabledReason:
        hasReachedSelectionLimit && !selectedTagSlugs.has(tag.slug)
          ? `장르는 최대 ${MAX_ROOM_TAG_FILTERS}개까지 선택할 수 있습니다.`
          : undefined,
      label: tag.name,
      value: tag.slug,
    })),
  ];
}

export function getNextHomeFilters(
  currentFilters: HomeFilterState,
  key: HomeFilterKey,
  option: HomeFilterOption,
): HomeFilterState {
  if (key === "genre") {
    const genreOption = option as HomeGenreFilterOption;

    if (genreOption === ALL_GENRE_FILTER_OPTION) {
      return {
        ...currentFilters,
        genre: [ALL_GENRE_FILTER_OPTION],
      };
    }

    const selectedGenres = getSelectedHomeGenreTags(currentFilters.genre);
    if (
      !selectedGenres.includes(genreOption) &&
      selectedGenres.length >= MAX_ROOM_TAG_FILTERS
    ) {
      return currentFilters;
    }

    const nextGenres = selectedGenres.includes(genreOption)
      ? selectedGenres.filter((genre) => genre !== genreOption)
      : [...selectedGenres, genreOption];

    return {
      ...currentFilters,
      genre:
        nextGenres.length > 0 ? nextGenres : [ALL_GENRE_FILTER_OPTION],
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

function toFilterOptionDescriptor<Option extends string>(
  option: Option,
): HomeFilterOptionDescriptor<Option> {
  return {
    label: option,
    value: option,
  };
}

function getFilterSections(genreOptions: HomeGenreFilterOptionDescriptor[]) {
  return [
    {
      key: "genre" as const,
      title: "Genre",
      options: genreOptions,
    },
    {
      key: "date" as const,
      title: "Date",
      options: dateFilterOptions.map(toFilterOptionDescriptor),
    },
    {
      key: "participants" as const,
      title: "Participants",
      options: participantsFilterOptions.map(toFilterOptionDescriptor),
    },
  ];
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
            const isRandomItem = item === "RANDOM";
            const isPendingRandom =
              isRandomItem && Boolean(props.isRandomEntryPending);

            return (
              <button
                key={item}
                type="button"
                className={styles.menuItem}
                disabled={isPendingRandom}
                aria-busy={isPendingRandom}
                onFocus={() => props.onMenuItemIntent?.(item)}
                onPointerDown={() => props.onMenuItemIntent?.(item)}
                onPointerEnter={() => props.onMenuItemIntent?.(item)}
                onClick={() => props.onSelectMenuItem(item)}
              >
                {isPendingRandom ? (
                  <LoadingSpinner ariaLabel="랜덤 방 찾는 중" size={16} />
                ) : (
                  item
                )}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  const filterSections = getFilterSections(props.genreOptions);

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
                option.value,
              );

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.optionChip} ${
                    isActive ? styles.activeChip : ""
                  }`}
                  aria-pressed={isActive}
                  disabled={option.disabled}
                  aria-label={option.loading ? "장르 로딩 중" : undefined}
                  title={option.disabledReason}
                  onClick={() => {
                    if (option.disabled) {
                      return;
                    }

                    props.onSelectFilter(section.key, option.value);
                  }}
                >
                  {option.loading ? (
                    <LoadingSpinner ariaLabel="장르 로딩 중" size={14} />
                  ) : (
                    <span>{option.label}</span>
                  )}
                  {option.statusLabel ? (
                    <span className={styles.optionStatus}>
                      {option.statusLabel}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
