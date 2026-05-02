import styles from "./HomeControlPanelShell.module.css";

type HomeControlPanelVariant = "menu" | "filter";

export const HOME_CONTROL_PANEL_IDS = {
  menu: "home-menu-panel",
  filter: "home-filter-panel",
} as const;

type Props = {
  variant: HomeControlPanelVariant;
};

const menuItems = ["QUE", "CREATE", "FRIEND", "SETTING"];

const filterSections = [
  {
    title: "Genre",
    options: ["ALL", "POP", "K-POP", "J-POP", "ANIMATION", "BAND", "HIP-HOP"],
  },
  {
    title: "Date",
    options: ["RANDOM", "OLD", "NEW"],
  },
  {
    title: "Participants",
    options: ["RANDOM", "HIGH", "LOW"],
  },
] as const;

export default function HomeControlPanelShell({ variant }: Props) {
  const panelId = HOME_CONTROL_PANEL_IDS[variant];

  if (variant === "menu") {
    return (
      <section
        id={panelId}
        className={`${styles.panel} ${styles.menuPanel}`}
        aria-label="홈 메뉴 패널"
      >
        <div className={styles.menuRow}>
          {menuItems.map((item, index) => (
            <span
              key={item}
              className={`${styles.menuItem} ${index === 0 ? styles.activeChip : ""}`}
            >
              {item}
            </span>
          ))}
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
            {section.options.map((option, index) => (
              <span
                key={option}
                className={`${styles.optionChip} ${index === 0 ? styles.activeChip : ""}`}
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
