"use client";

import { useState } from "react";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { useSearchUsers } from "../hooks/useSearchUsers";
import UserSearchList from "./UserSearchList";

export default function UserSearchBox() {
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useSearchUsers({ query });

  return (
    <div className=" p-3 text-black space-y-2">
      <span>사용자 검색</span>
      <input
        className="border px-2 py-1 w-full"
        placeholder="유저 검색 (slug/닉네임)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isLoading ? <LoadingSpinner ariaLabel="사용자 검색 중" size={18} /> : null}
      {isError && <div className="text-sm">검색 실패</div>}

      <UserSearchList data={data} />
    </div>
  );
}
