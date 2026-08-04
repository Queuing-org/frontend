export type BlockedUser = {
  blockedAt: string | null;
  cursorId: number;
  nickname: string;
  profileImageUrl: string | null;
  slug: string;
};

export type BlockedUserListResponse = {
  hasNext: boolean;
  items: BlockedUser[];
  nextCursor: number | null;
};

export type FetchBlockedUsersParams = {
  lastId?: number;
  size?: number;
};
