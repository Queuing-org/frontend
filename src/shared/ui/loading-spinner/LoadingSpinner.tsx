import { ClipLoader } from "react-spinners";
import styles from "./LoadingSpinner.module.css";

type Props = {
  announce?: boolean;
  ariaLabel: string;
  className?: string;
  color?: string;
  size?: number;
};

export default function LoadingSpinner({
  announce = true,
  ariaLabel,
  className,
  color = "#3c3c3c",
  size = 24,
}: Props) {
  return (
    <span
      className={`${styles.spinner} ${className ?? ""}`}
      role={announce ? "status" : undefined}
      aria-label={announce ? ariaLabel : undefined}
      aria-hidden={announce ? undefined : true}
    >
      <ClipLoader color={color} size={size} aria-hidden="true" />
    </span>
  );
}
