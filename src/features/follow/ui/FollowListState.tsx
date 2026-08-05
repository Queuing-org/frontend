import type { ReactNode } from "react";
import styles from "./FollowListState.module.css";

type Props = {
  children: ReactNode;
};

export default function FollowListState({ children }: Props) {
  return <div className={styles.state}>{children}</div>;
}
