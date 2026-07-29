export type FollowUser = {
  cursorId: number;
  nickname: string;
  slug: string;
  profileImageUrl: string | null;
  online: boolean;
  room: {
    slug: string;
    title: string;
  } | null;
  presenceVersion: number;
};

export type FollowListResponse = {
  items: FollowUser[];
  hasNext: boolean;
  nextCursor: number | null;
};

export type FollowingUser = FollowUser;
export type FollowingListResponse = FollowListResponse;
export type FollowerUser = FollowUser;
export type FollowersListResponse = FollowListResponse;

export type FollowPresenceEvent = {
  type: "USER_PRESENCE_CHANGED";
  data: {
    userSlug: string;
    online: boolean;
    room: FollowUser["room"];
    version: number;
  };
};
