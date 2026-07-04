type UserLike = {
  slug?: string | null;
  userSlug?: string | null;
  userId?: number | null;
};

function getPublicUserSlug(user: UserLike | null | undefined) {
  const slug = user?.userSlug ?? user?.slug;

  return slug?.trim() || null;
}

export function isSameUser(
  left: UserLike | null | undefined,
  right: UserLike | null | undefined,
) {
  if (!left || !right) {
    return false;
  }

  const leftSlug = getPublicUserSlug(left);
  const rightSlug = getPublicUserSlug(right);
  if (leftSlug && rightSlug) {
    return leftSlug === rightSlug;
  }

  if (left.userId != null && right.userId != null) {
    return left.userId === right.userId;
  }

  return false;
}

export function isRoomOwner(
  owner: UserLike | null | undefined,
  user: UserLike | null | undefined,
) {
  return isSameUser(owner, user);
}
