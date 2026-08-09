import type { ReactNode } from "react";
import styles from "./FollowListState.module.css";

type Props = {
  children: ReactNode;
  raised?: boolean;
};

export default function FollowListState({ children, raised = false }: Props) {
  return (
    <div className={`${styles.state} ${raised ? styles.raised : ""}`}>
      {children}
    </div>
  );
}
