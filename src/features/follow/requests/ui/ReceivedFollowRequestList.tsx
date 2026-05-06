"use client";

import { useFetchReceivedFollowRequest } from "../hooks/useFetchReceivedFollowRequest";
import FollowRequestCard from "./FollowRequestCard";
import styles from "./ReceivedFollowRequestList.module.css";

export default function ReceivedFollowRequestList() {
  const { data, isLoading, isError } = useFetchReceivedFollowRequest({
    limit: 20,
  });

  if (isLoading)
    return <div className={styles.state}>받은 친구요청 로딩중...</div>;

  if (isError)
    return <div className={styles.state}>받은 친구요청 로딩 실패</div>;

  const recived = data?.items ?? [];

  return (
    <div className={styles.container}>
      {recived.length === 0 ? (
        <div className={styles.state}>받은 친구요청이 없습니다.</div>
      ) : (
        <ul className={styles.list}>
          {recived.map((item) => (
            <li key={item.requestId}>
              <FollowRequestCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
