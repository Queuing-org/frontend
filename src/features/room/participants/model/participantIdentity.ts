type UserLike = {
  slug?: string | null;
  userId?: number | null;
};

export function isSameUser(
  left: UserLike | null | undefined,
  right: UserLike | null | undefined,
) {
  if (!left || !right) {
    return false;
  }

  if (left.userId != null && right.userId != null) {
    return left.userId === right.userId;
  }

  return !!left.slug && !!right.slug && left.slug === right.slug;
}

export function isRoomOwner(
  owner: UserLike | null | undefined,
  user: UserLike | null | undefined,
) {
  return isSameUser(owner, user);
}
