import styles from "./RoomSearchBadge.module.css";

type Props = {
  label?: string;
};

export default function RoomSearchBadge({ label = "SEARCH" }: Props) {
  return <div className={styles.badge}>{label}</div>;
}
