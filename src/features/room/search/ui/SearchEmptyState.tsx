import styles from "./SearchEmptyState.module.css";

type Props = {
  query: string;
  onCreateRoom: () => void;
};

export default function SearchEmptyState({ query, onCreateRoom }: Props) {
  const trimmedQuery = query.trim();
  const description = trimmedQuery
    ? `‘${trimmedQuery}’에 관한 방을 찾을 수 없어요.`
    : "조건에 맞는 방을 찾을 수 없어요.";

  return (
    <div className={styles.state}>
      <h2 className={styles.title}>검색 결과가 없습니다</h2>
      <p className={styles.description}>{description}</p>
      <button type="button" className={styles.button} onClick={onCreateRoom}>
        방 만들러 가기
      </button>
    </div>
  );
}
